import { Operation } from "apollo-codegen-core/lib/compiler";
import {
  GraphQLType,
  GraphQLInputType,
  GraphQLInputObjectType,
  GraphQLInputField,
  isInputObjectType,
  isNonNullType,
  isListType,
  isInputType
} from "graphql";

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
  ObjectProperty,
  Expression,
  isIdentifier
} from "@babel/types";

import { typeForInputType, typeReference, stringIdentifier } from "./types";
import { InputType } from "./intermediates";
import { OperationType } from "./genericTypes";
import compact from "./compact";
import generate from "@babel/generator";
import { callExpression } from "@babel/types";
import { logicalExpression } from "@babel/types";
import { isLogicalExpression } from "@babel/types";
import { memberExpression } from "@babel/types";

const objectPropertyForGraphQLInputField = (field: GraphQLInputField) =>
  objectProperty(identifier(field.name), identifier(field.name), false, true);

const exactValueForGraphQLInputType = (
  type: GraphQLInputType,
  fieldIdentifier: Identifier
): Expression => {
  if (isInputObjectType(type)) {
    return logicalExpression(
      "&&",
      fieldIdentifier,
      callExpression(identifier(type.name), [fieldIdentifier])
    );
  } else if (isNonNullType(type)) {
    const expression = exactValueForGraphQLInputType(
      type.ofType,
      fieldIdentifier
    );
    return isLogicalExpression(expression) ? expression.right : expression;
  } else if (isListType(type)) {
    const expression = exactValueForGraphQLInputType(
      type.ofType,
      fieldIdentifier
    );
    return isIdentifier(expression) && expression.name == fieldIdentifier.name
      ? expression
      : logicalExpression(
          "&&",
          fieldIdentifier,
          memberExpression(
            fieldIdentifier,
            callExpression(identifier("map"), [
              arrowFunctionExpression(
                [identifier("x")],
                exactValueForGraphQLInputType(type.ofType, identifier("x"))
              )
            ])
          )
        );
  } else {
    return fieldIdentifier;
  }
};

const exactPropertyForGraphQLInputField = (field: GraphQLInputField) =>
  objectProperty(
    identifier(field.name),
    exactValueForGraphQLInputType(field.type, identifier(field.name)),
    false,
    true
  );

export const typedIdentifier = (name: string, type: TSType): Identifier => ({
  ...identifier(name),
  typeAnnotation: TSTypeAnnotation(type) as any
});

const identifierForVariable = (variable: {
  name: string;
  type: GraphQLType;
}): Identifier =>
  typedIdentifier(
    variable.name,
    typeForInputType(InputType(variable.type as GraphQLInputType))
  );

const objectPropertiesForOperation = (operation: Operation): ObjectProperty[] =>
  compact(
    objectProperty(
      identifier("query"),
      stringIdentifier(operation.operationName)
    ),
    operation.variables.length > 0 &&
      objectProperty(
        identifier("variables"),
        objectExpression(
          operation.variables.map(variable =>
            objectProperty(
              identifier(variable.name),
              isInputType(variable.type)
                ? exactValueForGraphQLInputType(
                    variable.type,
                    identifier(variable.name)
                  )
                : identifier(variable.name),
              false,
              true
            )
          )
        )
      )
  );

export const constructorDeclaration = (
  name: string,
  parameters: LVal[],
  returnType: TSType,
  properties: ObjectProperty[]
) =>
  variableDeclaration("const", [
    variableDeclarator(identifier(name), {
      ...arrowFunctionExpression(
        parameters,
        parenthesizedExpression(objectExpression(properties))
      ),
      returnType: TSTypeAnnotation(returnType) as any
    } as ArrowFunctionExpression)
  ]);

export const constructorDeclarationForGraphQLInputObjectType = (
  type: GraphQLInputObjectType
) =>
  ((fields: GraphQLInputField[]) =>
    constructorDeclaration(
      type.name,
      [
        {
          ...identifier(
            generate(
              objectExpression(fields.map(objectPropertyForGraphQLInputField))
            ).code
          ),
          typeAnnotation: TSTypeAnnotation(typeReference(type.name)) as any
        }
      ],
      typeReference(type.name),
      fields.map(exactPropertyForGraphQLInputField)
    ))(Object.values(type.getFields()));

export const constructorDeclarationForOperation = (operation: Operation) =>
  constructorDeclaration(
    operation.operationName,
    operation.variables.map(identifierForVariable),
    OperationType(typeReference(operation.operationName)),
    objectPropertiesForOperation(operation)
  );
