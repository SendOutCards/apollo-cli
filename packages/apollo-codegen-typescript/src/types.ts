import { SelectionSet, Field, Fragment, Operation } from 'apollo-codegen-core/lib/compiler';

import { Set } from 'immutable';

import {
  GraphQLType,
  isScalarType,
  isListType,
  isNonNullType,
  GraphQLNonNull,
  GraphQLScalarType,
  GraphQLEnumType,
  GraphQLLeafType,
  GraphQLOutputType,
  isLeafType,
  GraphQLInputType,
  GraphQLInputObjectType,
  GraphQLEnumValue,
  GraphQLInputFieldMap,
  GraphQLInputField,
  isInputObjectType
} from 'graphql';

import {
  identifier,
  TSPropertySignature,
  TSTypeAliasDeclaration,
  TSUnionType,
  TSIntersectionType,
  TSType,
  TSStringKeyword,
  TSArrayType,
  TSNumberKeyword,
  TSBooleanKeyword,
  TSAnyKeyword,
  TSTypeReference,
  TSTypeParameterInstantiation,
  TSParenthesizedType,
  TSTypeLiteral,
  TSLiteralType,
  TSTypeAnnotation,
  stringLiteral,
  LVal,
  arrowFunctionExpression,
  ObjectExpression,
  TSEnumDeclaration,
  TSEnumMember,
  Declaration,
  exportNamedDeclaration,
  importDeclaration,
  importDefaultSpecifier
} from '@babel/types';
import { variableDeclaration } from '@babel/types';
import { variableDeclarator } from '@babel/types';
import { parenthesizedExpression } from '@babel/types';
import { objectExpression } from '@babel/types';
import { Identifier } from '@babel/types';
import { objectProperty } from '@babel/types';

const typeForGraphQLScalarType = (type: GraphQLScalarType): TSType => {
  switch (type.name) {
    case 'String':
    case 'ID':
      return TSStringKeyword();
    case 'Int':
    case 'Float':
      return TSNumberKeyword();
    case 'Boolean':
      return TSBooleanKeyword();
    default:
      return TSAnyKeyword();
  }
};

const typeForGraphQLEnumType = (type: GraphQLEnumType): TSType => typeReference(type.name);

const typeForGraphQLLeafType = (type: GraphQLLeafType): TSType =>
  isScalarType(type) ? typeForGraphQLScalarType(type) : typeForGraphQLEnumType(type);

const typeForNonNullGraphQLOutputType = (
  type: Exclude<GraphQLOutputType, GraphQLNonNull<any>>,
  selectionSet?: SelectionSet
): TSType =>
  isListType(type)
    ? TSArrayType(typeForGraphQLOutputType(type.ofType, selectionSet))
    : isLeafType(type)
      ? typeForGraphQLLeafType(type)
      : selectionSet != undefined
        ? typeForSelectionSet(selectionSet)
        : TSAnyKeyword();

const typeForGraphQLOutputType = (type: GraphQLOutputType, selectionSet?: SelectionSet): TSType =>
  isNonNullType(type)
    ? typeForNonNullGraphQLOutputType(type.ofType, selectionSet)
    : MaybeType(typeForNonNullGraphQLOutputType(type, selectionSet));

const typeForNonNullGraphQLInputType = (type: Exclude<GraphQLInputType, GraphQLNonNull<any>>): TSType =>
  isListType(type)
    ? TSArrayType(typeForGraphQLInputType(type.ofType))
    : isInputObjectType(type)
      ? typeReference(type.name)
      : isLeafType(type)
        ? typeForGraphQLLeafType(type)
        : TSAnyKeyword();

const typeForGraphQLInputType = (type: GraphQLInputType): TSType =>
  isNonNullType(type)
    ? typeForNonNullGraphQLInputType(type.ofType)
    : OptionalType(typeForNonNullGraphQLInputType(type));

const typeReference = (name: string): TSTypeReference => TSTypeReference(identifier(name));

const propertySignatureForField = (field: Field): TSPropertySignature =>
  TSPropertySignature(
    identifier(field.alias ? field.alias : field.name),
    TSTypeAnnotation(typeForGraphQLOutputType(field.type, field.selectionSet))
  );

type Type = NamedType | UnnamedType;

type NamedType = {
  named: true;
  name: string;
  possibleTypes: Set<string>;
};

function NamedType(name: string, possibleTypes: Set<string>): NamedType {
  return {
    named: true,
    name,
    possibleTypes
  };
}

type UnnamedType = {
  named: false;
  possibleTypes: Set<string>;
  intersections: NamedType[];
  fields: Field[];
  booleanConditions: Type[];
  typeConditions: Type[];
};

const getType = (selectionSet: SelectionSet): Type => {
  const unnamed = getUnnamedType(selectionSet);
  return unnamed.intersections.length == 1 &&
    unnamed.fields.length == 0 &&
    unnamed.booleanConditions.length == 0 &&
    unnamed.typeConditions.length == 0
    ? unnamed.intersections[0]
    : unnamed;
};

const getUnnamedType = (selectionSet: SelectionSet): UnnamedType => {
  const emptyType: UnnamedType = {
    named: false,
    possibleTypes: Set(selectionSet.possibleTypes.map(type => type.name)),
    intersections: [],
    fields: [],
    booleanConditions: [],
    typeConditions: []
  };
  return selectionSet.selections.reduce((type, selection) => {
    switch (selection.kind) {
      case 'Field':
        return { ...type, fields: [...type.fields, selection] };
      case 'BooleanCondition':
        return { ...type, booleanConditions: [...type.booleanConditions, getType(selection.selectionSet)] };
      case 'TypeCondition':
        const conditionalType = getType(selection.selectionSet);
        if (conditionalType.possibleTypes.equals(type.possibleTypes)) {
          if (conditionalType.named) {
            return { ...type, intersections: [...type.intersections, conditionalType] };
          } else {
            return {
              ...type,
              intersections: type.intersections.concat(conditionalType.intersections),
              fields: type.fields.concat(conditionalType.fields),
              booleanConditions: type.booleanConditions.concat(conditionalType.booleanConditions),
              typeConditions: type.typeConditions.concat(conditionalType.typeConditions)
            };
          }
        }
        return { ...type, typeConditions: [...type.typeConditions, conditionalType] };
      case 'FragmentSpread':
        const possibleTypes = Set(selection.selectionSet.possibleTypes.map(type => type.name));
        const fragmentType = NamedType(selection.fragmentName, possibleTypes);
        return possibleTypes.isSuperset(type.possibleTypes)
          ? { ...type, intersections: [...type.intersections, fragmentType] }
          : {
              ...type,
              typeConditions: [...type.typeConditions, fragmentType]
            };
    }
  }, emptyType);
};

const GenericType = (name: string, ...types: TSType[]): TSType =>
  TSTypeReference(identifier(name), TSTypeParameterInstantiation(types) as any);

const MaybeType = (type: TSType): TSType => GenericType('Maybe', type);

const PartialType = (type: TSType): TSType => GenericType('Partial', type);

const IfType = (possibleTypes: Set<string>, type: TSType): TSType =>
  GenericType(
    'If',
    TSUnionType(
      possibleTypes
        .sort()
        .toArray()
        .map(type => TSLiteralType(stringLiteral(type)))
    ),
    type
  );

const OptionalType = (type: TSType): TSType => GenericType('Optional', type);

const typeForNamedType = (type: NamedType): TSType => typeReference(type.name);

const typeForType = (type: Type): TSType => (type.named ? typeForNamedType(type) : typeForUnnamedType(type));

const EmptyType = TSTypeLiteral([]);

const unionTypeForTypeConditions = (typeConditions: Type[], possibleTypes: Set<string>): TSUnionType => {
  const remainingPossibleTypes = possibleTypes.subtract(
    typeConditions.reduce((possibleTypes, type) => possibleTypes.union(type.possibleTypes), Set<string>())
  );
  return TSUnionType(
    typeConditions
      .map(type => IfType(type.possibleTypes, typeForType(type)))
      .concat(remainingPossibleTypes.size > 0 ? [IfType(remainingPossibleTypes, EmptyType)] : [])
  );
};

const typeForUnnamedType = (type: UnnamedType): TSType =>
  TSIntersectionType(
    [
      ...type.intersections.map(typeForNamedType),
      type.fields.length > 0 ? TSTypeLiteral(type.fields.map(propertySignatureForField)) : undefined,
      type.booleanConditions.length > 0
        ? PartialType(TSIntersectionType(type.booleanConditions.map(typeForType)))
        : undefined,
      type.typeConditions.length > 0
        ? TSParenthesizedType(unionTypeForTypeConditions(type.typeConditions, type.possibleTypes))
        : undefined
    ]
      .filter(x => x)
      .map(x => x as TSType)
  );

const typeForSelectionSet = (selectionSet: SelectionSet) => typeForUnnamedType(getUnnamedType(selectionSet));

const enumMemberForGraphQLEnumValue = (value: GraphQLEnumValue) =>
  TSEnumMember(identifier(value.name), stringLiteral(value.name));

export const enumDeclarationForGraphQLEnumType = (type: GraphQLEnumType) =>
  TSEnumDeclaration(identifier(type.name), type.getValues().map(enumMemberForGraphQLEnumValue));

const propertySignatureForGraphQLInputField = (field: GraphQLInputField) =>
  TSPropertySignature(identifier(field.name), TSTypeAnnotation(typeForGraphQLInputType(field.type)));

const typeForGraphQLInputFieldMap = (map: GraphQLInputFieldMap) =>
  TSTypeLiteral(Object.values(map).map(propertySignatureForGraphQLInputField));

export const typeAliasDeclarationForGraphQLInputObjectType = (type: GraphQLInputObjectType) =>
  TSTypeAliasDeclaration(identifier(type.name), undefined, typeForGraphQLInputFieldMap(type.getFields()));

const objectPropertyForGraphQLInputField = (field: GraphQLInputField) =>
  objectProperty(identifier(field.name), identifier(field.name), false, true);

const lvalForGraphQLInputField = (field: GraphQLInputField) =>
  typedIdentifier(field.name, typeForGraphQLInputType(field.type as GraphQLInputType));

const arrowFunctionExpressionForGraphQLInputFields = (fields: GraphQLInputField[]) =>
  arrowFunctionExpression(
    fields.map(lvalForGraphQLInputField),
    parenthesizedExpression(objectExpression(fields.map(objectPropertyForGraphQLInputField)))
  );

export const variableDeclarationForGraphQLInputObjectType = (type: GraphQLInputObjectType) =>
  variableDeclaration('const', [
    variableDeclarator(
      identifier(type.name),
      arrowFunctionExpressionForGraphQLInputFields(Object.values(type.getFields()))
    )
  ]);

export const importDeclarationForFragment = (fragment: Fragment) =>
  importDeclaration(
    [importDefaultSpecifier(identifier(fragment.fragmentName + 'RawString'))],
    stringLiteral(fragment.filePath)
  );

export const typeAliasDeclarationForFragment = (fragment: Fragment) =>
  TSTypeAliasDeclaration(
    identifier(fragment.fragmentName),
    undefined,
    typeForSelectionSet(fragment.selectionSet)
  );

export const typeAliasDeclarationForOperation = (operation: Operation) =>
  TSTypeAliasDeclaration(
    identifier(operation.operationName),
    undefined,
    typeForSelectionSet(operation.selectionSet)
  );

const typedIdentifier = (name: string, type: TSType): Identifier => ({
  ...identifier(name),
  typeAnnotation: TSTypeAnnotation(type) as any
});

const lvalForVariable = (variable: { name: string; type: GraphQLType }): LVal =>
  typedIdentifier(variable.name, typeForGraphQLInputType(variable.type as GraphQLInputType));

const objectExpressionForOperation = (operation: Operation): ObjectExpression =>
  objectExpression([
    objectProperty(identifier('query'), identifier('raw' + operation.operationName)),
    objectProperty(
      identifier('variables'),
      objectExpression(
        operation.variables.map(variable =>
          objectProperty(identifier(variable.name), identifier(variable.name), false, true)
        )
      )
    )
  ]);

export const variableDeclarationForOperation = (operation: Operation) =>
  variableDeclaration('const', [
    variableDeclarator(
      identifier(operation.operationName),
      arrowFunctionExpression(
        operation.variables.map(lvalForVariable),
        parenthesizedExpression(objectExpressionForOperation(operation))
      )
    )
  ]);

export const exportDeclaration = (expression: Declaration) => exportNamedDeclaration(expression, []);
