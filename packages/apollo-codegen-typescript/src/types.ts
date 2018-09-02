import { SelectionSet, Fragment, Operation } from 'apollo-codegen-core/lib/compiler';

import { Set } from 'immutable';

import { camelCase } from 'lodash';

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
  importDefaultSpecifier,
  importSpecifier,
  ImportDeclaration
} from '@babel/types';
import { variableDeclaration } from '@babel/types';
import { variableDeclarator } from '@babel/types';
import { parenthesizedExpression } from '@babel/types';
import { objectExpression } from '@babel/types';
import { Identifier } from '@babel/types';
import { objectProperty } from '@babel/types';
import { ImportDefaultSpecifier } from '@babel/types';

import { AnyObject, FragmentReference, InlineSelection, Field, OutputType, Scalar } from './anyObject';
import { fragmentDependencies, Dependency, selectionSetGlobalDependencies } from './dependencies';

const typeForGraphQLEnumType = (type: GraphQLEnumType): TSType => typeReference(type.name);

const typeForGraphQLLeafType = (type: GraphQLLeafType): TSType =>
  isScalarType(type) ? typeForScalarName(type.name) : typeForGraphQLEnumType(type);

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

const typeForScalarName = (scalarName: string): TSType => {
  switch (scalarName) {
    case 'Int':
    case 'Float':
      return TSNumberKeyword();
    case 'Boolean':
      return TSBooleanKeyword();
    default:
      return TSStringKeyword();
  }
};

const typeForScalar = (type: Scalar): TSType => typeForScalarName(type.name);

const typeForOutputType = (type: OutputType): TSType => {
  switch (type.kind) {
    case 'Maybe':
      return MaybeType(typeForOutputType(type.ofType));
    case 'List':
      return TSArrayType(typeForOutputType(type.ofType));
    case 'FragmentReference':
      return typeReference(type.name);
    case 'InlineSelection':
      return typeForInlineSelection(type);
    case 'Enum':
      return typeReference(type.name);
    case 'Scalar':
      return typeForScalar(type);
  }
};

const propertySignatureForField = (field: Field): TSPropertySignature =>
  TSPropertySignature(identifier(field.name), TSTypeAnnotation(typeForOutputType(field.type)));

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

const typeForFragmentReference = (type: FragmentReference): TSType => typeReference(type.name);

const typeForAnyObject = (object: AnyObject): TSType =>
  object.kind == 'FragmentReference' ? typeForFragmentReference(object) : typeForInlineSelection(object);

const emptyType = TSTypeLiteral([]);

const unionTypeForTypeConditions = (typeConditions: AnyObject[], possibleTypes: Set<string>): TSUnionType => {
  const remainingPossibleTypes = possibleTypes.subtract(
    typeConditions.reduce((possibleTypes, type) => possibleTypes.union(type.possibleTypes), Set<string>())
  );
  return TSUnionType(
    typeConditions
      .map(type => IfType(type.possibleTypes, typeForAnyObject(type)))
      .concat(remainingPossibleTypes.size > 0 ? [IfType(remainingPossibleTypes, emptyType)] : [])
  );
};

const typeForInlineSelection = (type: InlineSelection): TSType =>
  TSIntersectionType(
    [
      ...type.intersections.map(typeForFragmentReference),
      type.fields.length > 0 ? TSTypeLiteral(type.fields.map(propertySignatureForField)) : undefined,
      type.booleanConditions.length > 0
        ? PartialType(TSIntersectionType(type.booleanConditions.map(typeForAnyObject)))
        : undefined,
      type.typeConditions.length > 0
        ? TSParenthesizedType(unionTypeForTypeConditions(type.typeConditions, type.possibleTypes))
        : undefined
    ]
      .filter(x => x)
      .map(x => x as TSType)
  );

const typeForSelectionSet = (selectionSet: SelectionSet) =>
  typeForInlineSelection(InlineSelection(selectionSet));

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

const rawStringImportDefaultSpecifier = (fragmentOrOperationName: string): ImportDefaultSpecifier =>
  importDefaultSpecifier(identifier(camelCase(fragmentOrOperationName + 'RawString')));

const globalImportDeclarationForDependencies = (dependencies: string[]): ImportDeclaration | undefined =>
  dependencies.length > 0
    ? importDeclaration(
        dependencies.map(dependency => importSpecifier(identifier(dependency), identifier(dependency))),
        stringLiteral('../__generated__/globalTypes')
      )
    : undefined;

export const globalImportDeclarationForFragmentDependencies = (fragment: Fragment) =>
  globalImportDeclarationForDependencies(selectionSetGlobalDependencies(fragment.selectionSet));

export const importDeclarationForFragmentRawString = (fragment: Fragment) =>
  importDeclaration(
    [rawStringImportDefaultSpecifier(fragment.fragmentName)],
    stringLiteral('../' + fragment.filePath)
  );

export const typeAliasDeclarationForFragment = (fragment: Fragment) =>
  TSTypeAliasDeclaration(
    identifier(fragment.fragmentName),
    undefined,
    typeForSelectionSet(fragment.selectionSet)
  );

export const importDeclarationForOperationRawString = (operation: Operation) =>
  importDeclaration(
    [rawStringImportDefaultSpecifier(operation.operationName)],
    stringLiteral('../' + operation.filePath)
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
