import { Operation } from "apollo-codegen-core/lib/compiler";
import {
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

import { typeReference, stringIdentifier } from "./types";
import compact from "./compact";
import generate from "@babel/generator";
import { callExpression } from "@babel/types";
import { logicalExpression } from "@babel/types";
import { isLogicalExpression } from "@babel/types";
import { memberExpression } from "@babel/types";
import { assignmentPattern } from "@babel/types";

const shorthandObjectProperty = (name: string) =>
  objectProperty(identifier(name), identifier(name), false, true);

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
          callExpression(memberExpression(fieldIdentifier, identifier("map")), [
            arrowFunctionExpression(
              [identifier("x")],
              exactValueForGraphQLInputType(type.ofType, identifier("x"))
            )
          ])
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

const objectPropertiesForOperation = (
  operation: Operation
): ObjectProperty[] => [
  objectProperty(
    identifier("query"),
    stringIdentifier(operation.operationName)
  ),
  objectProperty(
    identifier("variables"),
    operation.variables.length > 0
      ? objectExpression(
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
      : identifier("undefined")
  )
];

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

const destructuredParameter = (
  objectProperties: string[],
  typeName: string,
  defaultToEmptyObject: boolean
) => {
  const annotatedIdentifier = {
    ...identifier(
      generate(objectExpression(objectProperties.map(shorthandObjectProperty)))
        .code
    ),
    typeAnnotation: TSTypeAnnotation(typeReference(typeName)) as any
  };
  return defaultToEmptyObject
    ? assignmentPattern(annotatedIdentifier, objectExpression([]))
    : annotatedIdentifier;
};

export const constructorDeclarationForGraphQLInputObjectType = (
  type: GraphQLInputObjectType
) => {
  const fields = Object.values(type.getFields());
  return constructorDeclaration(
    type.name,
    [
      destructuredParameter(
        fields.map(field => field.name),
        type.name,
        !fields.some(field => isNonNullType(field.type))
      )
    ],
    typeReference(type.name),
    fields.map(exactPropertyForGraphQLInputField)
  );
};

export const constructorDeclarationForOperation = (operation: Operation) =>
  constructorDeclaration(
    operation.operationName,
    compact(
      operation.variables.length > 0 &&
        destructuredParameter(
          operation.variables.map(variable => variable.name),
          operation.operationName + "Variables",
          !operation.variables.some(variable => isNonNullType(variable.type))
        )
    ),
    typeReference(operation.operationName),
    objectPropertiesForOperation(operation)
  );
