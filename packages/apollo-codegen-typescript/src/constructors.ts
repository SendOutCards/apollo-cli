import { Operation } from 'apollo-codegen-core/lib/compiler';
import { GraphQLType, GraphQLInputType, GraphQLInputObjectType, GraphQLInputField } from 'graphql';

import {
  identifier,
  TSType,
  TSTypeAnnotation,
  LVal,
  arrowFunctionExpression,
  variableDeclaration,
  variableDeclarator,
  parenthesizedExpression,
  objectExpression,
  Identifier,
  objectProperty,
  ArrowFunctionExpression,
  ObjectProperty
} from '@babel/types';

import { typeForInputType, typeReference, stringIdentifier } from './types';
import { InputType } from './intermediates';
import { OperationType } from './genericTypes';
import compact from './compact';

const objectPropertyForGraphQLInputField = (field: GraphQLInputField) =>
  objectProperty(identifier(field.name), identifier(field.name), false, true);

const identifierForGraphQLInputField = (field: GraphQLInputField): Identifier =>
  typedIdentifier(field.name, typeForInputType(InputType(field.type)));

const typedIdentifier = (name: string, type: TSType): Identifier => ({
  ...identifier(name),
  typeAnnotation: TSTypeAnnotation(type) as any
});

const identifierForVariable = (variable: { name: string; type: GraphQLType }): Identifier =>
  typedIdentifier(variable.name, typeForInputType(InputType(variable.type as GraphQLInputType)));

const objectPropertiesForOperation = (operation: Operation): ObjectProperty[] =>
  compact(
    objectProperty(identifier('query'), stringIdentifier(operation.operationName)),
    operation.variables.length > 0 &&
      objectProperty(
        identifier('variables'),
        objectExpression(
          operation.variables.map(variable =>
            objectProperty(identifier(variable.name), identifier(variable.name), false, true)
          )
        )
      )
  );

const constructorDeclaration = (
  name: string,
  parameters: LVal[],
  returnType: TSType,
  properties: ObjectProperty[]
) =>
  variableDeclaration('const', [
    variableDeclarator(identifier(name), {
      ...arrowFunctionExpression(parameters, parenthesizedExpression(objectExpression(properties))),
      returnType: TSTypeAnnotation(returnType) as any
    } as ArrowFunctionExpression)
  ]);

export const constructorDeclarationForGraphQLInputObjectType = (type: GraphQLInputObjectType) =>
  ((fields: GraphQLInputField[]) =>
    constructorDeclaration(
      type.name,
      fields.map(identifierForGraphQLInputField),
      typeReference(type.name),
      fields.map(objectPropertyForGraphQLInputField)
    ))(Object.values(type.getFields()));

export const constructorDeclarationForOperation = (operation: Operation) =>
  constructorDeclaration(
    operation.operationName,
    operation.variables.map(identifierForVariable),
    OperationType(typeReference(operation.operationName)),
    objectPropertiesForOperation(operation)
  );
