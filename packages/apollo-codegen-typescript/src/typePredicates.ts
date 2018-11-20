import { Fragment } from "apollo-codegen-core/lib/compiler";
import {
  variableDeclaration,
  variableDeclarator,
  arrowFunctionExpression,
  TSTypeAnnotation,
  TSTypePredicate,
  TSTypeReference,
  Expression,
  memberExpression,
  booleanLiteral,
  binaryExpression,
  nullLiteral,
  stringLiteral,
  TSAnyKeyword,
  TSBooleanKeyword,
  TSAsExpression
} from "@babel/types";
import { identifier } from "@babel/types";
import { ArrowFunctionExpression } from "@babel/types";
import {
  InlineSelection,
  OutputType,
  Typename,
  Scalar,
  FragmentReference
} from "./intermediates";
import { logicalExpression } from "@babel/types";
import { isLogicalExpression } from "@babel/types";
import { parenthesizedExpression } from "@babel/types";
import { callExpression } from "@babel/types";
import { numericLiteral } from "@babel/types";
import { unaryExpression } from "@babel/types";
import { typedIdentifier } from "./constructors";
import compact from "./compact";
import { remainingPossibleTypes } from "./types";

const possiblyParenthesizedExpression = (
  expression: Expression,
  parentOperator: "&&" | "||"
) =>
  isLogicalExpression(expression) && expression.operator != parentOperator
    ? parenthesizedExpression(expression)
    : expression;

const logicallyCombine = (
  operator: "&&" | "||",
  expressions: Expression[]
): Expression =>
  expressions.length < 1
    ? booleanLiteral(operator == "&&")
    : expressions
        .slice(1)
        .reduce(
          (expression: Expression, nextExpression) =>
            logicalExpression(
              operator,
              expression,
              possiblyParenthesizedExpression(nextExpression, operator)
            ),
          possiblyParenthesizedExpression(expressions[0], operator)
        );

const and = (...expressions: Expression[]) =>
  logicallyCombine("&&", expressions);

const or = (...expressions: Expression[]) =>
  logicallyCombine("||", expressions);

const nullPredicate = (expression: Expression) =>
  binaryExpression("==", expression, nullLiteral());

const scalarType = (scalar: Scalar): string => {
  switch (scalar.name) {
    case "Int":
    case "Float":
      return "number";
    case "Boolean":
      return "boolean";
    default:
      return "string";
  }
};

const isFragmentReference: (
  expression: Expression
) => (
  fragmentReference: FragmentReference
) => Expression = expression => fragmentReference =>
  TSAsExpression(
    callExpression(identifier(`is${fragmentReference.name}`), [expression]),
    TSBooleanKeyword()
  );

const accumIdentifier = typedIdentifier("accum", TSAnyKeyword());
const nextIdentifier = typedIdentifier("next", TSAnyKeyword());

const listPredicate = (expression: Expression, ofType: OutputType | Typename) =>
  and(
    callExpression(
      memberExpression(identifier("Array"), identifier("isArray")),
      [expression]
    ),
    callExpression(
      memberExpression(
        callExpression(memberExpression(expression, identifier("slice")), [
          numericLiteral(0),
          numericLiteral(5)
        ]),
        identifier("reduce")
      ),
      [
        arrowFunctionExpression(
          [accumIdentifier, nextIdentifier],
          and(accumIdentifier, typePredicate(nextIdentifier, ofType))
        ),
        booleanLiteral(true)
      ]
    )
  );

const typePredicate = (
  expression: Expression,
  type: OutputType | Typename,
  validated?: boolean
): Expression => {
  switch (type.kind) {
    case "Maybe":
      return or(
        nullPredicate(expression),
        typePredicate(expression, type.ofType)
      );
    case "List":
      return listPredicate(expression, type.ofType);
    case "FragmentReference":
      return isFragmentReference(expression)(type);
    case "InlineSelection":
      return inlineSelectionPredicate(type, expression, validated);
    case "Enum":
      return or(
        ...type.values.map(value =>
          binaryExpression("==", expression, stringLiteral(value))
        )
      );
    case "Scalar":
      return binaryExpression(
        "==",
        unaryExpression("typeof", expression),
        stringLiteral(scalarType(type))
      );
    case "Typename":
      return or(
        ...type.possibleTypes
          .toArray()
          .map(type => binaryExpression("==", expression, stringLiteral(type)))
      );
  }
};

const typenamePredicate = (object: Expression, type: string) =>
  binaryExpression(
    "==",
    memberExpression(object, identifier("__typename")),
    stringLiteral(type)
  );

const typeConditionsPredicate = (
  inlineSelection: InlineSelection,
  object: Expression
) => {
  const remainingTypes = remainingPossibleTypes(
    inlineSelection.typeConditions,
    inlineSelection.possibleTypes
  );
  return (
    inlineSelection.typeConditions.length > 0 &&
    or(
      ...inlineSelection.typeConditions.map(condition =>
        and(
          or(
            ...condition.possibleTypes
              .toArray()
              .map(type => typenamePredicate(object, type))
          ),
          typePredicate(object, condition, true)
        )
      ),
      ...remainingTypes.toArray().map(type => typenamePredicate(object, type))
    )
  );
};

const inlineSelectionPredicate = (
  inlineSelection: InlineSelection,
  object: Expression,
  validated?: boolean
): Expression =>
  and(
    ...compact(
      ...inlineSelection.intersections.map(isFragmentReference(object)),
      inlineSelection.intersections.length == 0 && !validated && object,
      ...inlineSelection.fields.map(field =>
        typePredicate(
          memberExpression(object, identifier(field.name)),
          field.type
        )
      ),
      typeConditionsPredicate(inlineSelection, object)
    )
  );

const fragmentIdentifier = identifier("fragment");

export const isFragmentDeclaration = (fragment: Fragment) =>
  variableDeclaration("const", [
    variableDeclarator(identifier(`is${fragment.fragmentName}`), {
      ...arrowFunctionExpression(
        [typedIdentifier(fragmentIdentifier.name, TSAnyKeyword())],
        inlineSelectionPredicate(
          InlineSelection(fragment.selectionSet),
          fragmentIdentifier
        )
      ),
      returnType: TSTypeAnnotation(
        TSTypePredicate(
          fragmentIdentifier,
          TSTypeAnnotation(TSTypeReference(identifier(fragment.fragmentName)))
        )
      ) as any
    } as ArrowFunctionExpression)
  ]);
