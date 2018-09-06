import { SelectionSet, Fragment, Operation, CompilerContext } from 'apollo-codegen-core/lib/compiler';

import { Set } from 'immutable';

import { camelCase } from 'lodash';

import {
  GraphQLType,
  GraphQLEnumType,
  GraphQLInputType,
  GraphQLInputObjectType,
  GraphQLEnumValue,
  GraphQLInputFieldMap,
  GraphQLInputField
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
  TSTypeReference,
  TSParenthesizedType,
  TSTypeLiteral,
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
  ImportDeclaration,
  variableDeclaration,
  variableDeclarator,
  parenthesizedExpression,
  objectExpression,
  Identifier,
  objectProperty,
  ImportDefaultSpecifier,
  ImportSpecifier,
  arrayExpression,
  callExpression,
  memberExpression
} from '@babel/types';

import {
  AnyObject,
  FragmentReference,
  InlineSelection,
  Field,
  OutputType,
  InputType,
  Scalar
} from './intermediates';
import Dependencies from './dependencies';
import { OptionalType, MaybeType, IfType, PartialType } from './genericTypes';
import { relativePath, outputPath } from './paths';

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

const typeForInputType = (type: InputType): TSType => {
  switch (type.kind) {
    case 'Maybe':
      return OptionalType(typeForInputType(type.ofType));
    case 'List':
      return TSArrayType(typeForInputType(type.ofType));
    case 'InputObject':
      return typeReference(type.name);
    case 'Enum':
      return typeReference(type.name);
    case 'Scalar':
      return typeForScalar(type);
  }
};

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
  TSPropertySignature(identifier(field.name), TSTypeAnnotation(typeForInputType(InputType(field.type))));

const typeForGraphQLInputFieldMap = (map: GraphQLInputFieldMap) =>
  TSTypeLiteral(Object.values(map).map(propertySignatureForGraphQLInputField));

export const typeAliasDeclarationForGraphQLInputObjectType = (type: GraphQLInputObjectType) =>
  TSTypeAliasDeclaration(identifier(type.name), undefined, typeForGraphQLInputFieldMap(type.getFields()));

const objectPropertyForGraphQLInputField = (field: GraphQLInputField) =>
  objectProperty(identifier(field.name), identifier(field.name), false, true);

const lvalForGraphQLInputField = (field: GraphQLInputField) =>
  typedIdentifier(field.name, typeForInputType(InputType(field.type)));

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

const rawStringIdentifier = (fragmentOrOperationName: string): Identifier =>
  identifier(camelCase(fragmentOrOperationName + 'RawString'));

const stringIdentifier = (fragmentOrOperationName: string): Identifier =>
  identifier(camelCase(fragmentOrOperationName + 'String'));

const rawStringImportDefaultSpecifier = (fragmentOrOperationName: string): ImportDefaultSpecifier =>
  importDefaultSpecifier(rawStringIdentifier(fragmentOrOperationName));

const importSpecifierWithIdentifier = (identifier: Identifier): ImportSpecifier =>
  importSpecifier(identifier, identifier);

const stringImportSpecifier = (fragmentName: string): ImportSpecifier =>
  importSpecifierWithIdentifier(stringIdentifier(fragmentName));

const importDeclarationForGlobalDependencies = (
  dependencies: string[],
  relativeGlobalSourcePath: string
): ImportDeclaration =>
  importDeclaration(
    dependencies.map(dependency => importSpecifierWithIdentifier(identifier(dependency))),
    stringLiteral(relativeGlobalSourcePath)
  );

export const typeAliasDeclarationForFragment = (fragment: Fragment) =>
  TSTypeAliasDeclaration(
    identifier(fragment.fragmentName),
    undefined,
    typeForSelectionSet(fragment.selectionSet)
  );

export const rawStringImportDeclaration = (
  fragmentOrOperationName: string,
  filePath: string,
  outputPath: string
) =>
  importDeclaration(
    [rawStringImportDefaultSpecifier(fragmentOrOperationName)],
    stringLiteral(relativePath(outputPath, filePath))
  );

export const stringDeclaration = (fragmentOrOperationName: string, fragmentDependencies: string[]) =>
  variableDeclaration('const', [
    variableDeclarator(
      stringIdentifier(fragmentOrOperationName),
      callExpression(
        memberExpression(
          arrayExpression([
            rawStringIdentifier(fragmentOrOperationName),
            ...fragmentDependencies.map(fragment => stringIdentifier(fragment))
          ]),
          identifier('join')
        ),
        [stringLiteral('\n\n')]
      )
    )
  ]);

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
  typedIdentifier(variable.name, typeForInputType(InputType(variable.type as GraphQLInputType)));

const objectExpressionForOperation = (operation: Operation): ObjectExpression =>
  objectExpression([
    objectProperty(identifier('query'), stringIdentifier(operation.operationName)),
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

const importDeclarationForFragmentDependency = (fragment: Fragment, filePath: string): ImportDeclaration =>
  importDeclaration(
    [
      importSpecifierWithIdentifier(identifier(fragment.fragmentName)),
      stringImportSpecifier(fragment.fragmentName)
    ],
    stringLiteral(relativePath(filePath, outputPath(fragment.fragmentName, fragment.filePath)))
  );

export const importDeclarationsForDependencies = (
  dependencies: Dependencies,
  outputPath: string,
  globalSourcePath: string,
  context: CompilerContext
): ImportDeclaration[] =>
  [
    dependencies.global.length > 0
      ? importDeclarationForGlobalDependencies(
          dependencies.global,
          relativePath(outputPath, globalSourcePath)
        )
      : undefined,
    ...dependencies.fragments.map(fragment =>
      importDeclarationForFragmentDependency(context.fragments[fragment], outputPath)
    )
  ].filter(declaration => declaration) as ImportDeclaration[];
