import {
  SelectionSet,
  Fragment,
  Operation
} from "apollo-codegen-core/lib/compiler";

import { Set } from "immutable";

import { camelCase } from "lodash";

import {
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLEnumValue,
  GraphQLInputFieldMap,
  GraphQLInputField
} from "graphql";

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
  TSEnumDeclaration,
  TSEnumMember,
  Declaration,
  exportNamedDeclaration,
  Identifier,
  TSLiteralType
} from "@babel/types";

import {
  FragmentOrSelection,
  FragmentReference,
  InlineSelection,
  Field,
  OutputType,
  InputType,
  Scalar,
  Typename
} from "./intermediates";
import { OptionalType, MaybeType, IfType, PartialType } from "./genericTypes";

export const typeReference = (name: string): TSTypeReference =>
  TSTypeReference(identifier(name));

export const typeForScalar = (scalar: Scalar): TSType => {
  switch (scalar.name) {
    case "Int":
    case "Float":
      return TSNumberKeyword();
    case "Boolean":
      return TSBooleanKeyword();
    default:
      return TSStringKeyword();
  }
};

export const typeForInputType = (type: InputType): TSType => {
  switch (type.kind) {
    case "Maybe":
      return OptionalType(typeForInputType(type.ofType));
    case "List":
      return TSArrayType(typeForInputType(type.ofType));
    case "InputObject":
      return typeReference(type.name);
    case "Enum":
      return typeReference(type.name);
    case "Scalar":
      return typeForScalar(type);
  }
};

export const typeForTypename = (typename: Typename): TSType =>
  TSUnionType(
    typename.possibleTypes
      .toArray()
      .map(type => TSLiteralType(stringLiteral(type)))
  );

const typeForOutputType = (type: OutputType | Typename): TSType => {
  switch (type.kind) {
    case "Maybe":
      return MaybeType(typeForOutputType(type.ofType));
    case "List":
      return TSArrayType(typeForOutputType(type.ofType));
    case "FragmentReference":
      return typeReference(type.name);
    case "InlineSelection":
      return typeForInlineSelection(type);
    case "Enum":
      return typeReference(type.name);
    case "Scalar":
      return typeForScalar(type);
    case "Typename":
      return typeForTypename(type);
  }
};

const propertySignatureForField = (field: Field): TSPropertySignature =>
  TSPropertySignature(
    identifier(field.name),
    TSTypeAnnotation(typeForOutputType(field.type))
  );

const typeForFragmentReference = (type: FragmentReference): TSType =>
  typeReference(type.name);

const typeForAnyObject = (object: FragmentOrSelection): TSType =>
  object.kind == "FragmentReference"
    ? typeForFragmentReference(object)
    : typeForInlineSelection(object);

const emptyType = TSTypeLiteral([]);

export const remainingPossibleTypes = (
  typeConditions: FragmentOrSelection[],
  possibleTypes: Set<string>
): Set<string> =>
  possibleTypes.subtract(
    typeConditions.reduce(
      (possibleTypes, type) => possibleTypes.union(type.possibleTypes),
      Set<string>()
    )
  );

const unionTypeForTypeConditions = (
  typeConditions: FragmentOrSelection[],
  possibleTypes: Set<string>
): TSUnionType => {
  const remainingTypes = remainingPossibleTypes(typeConditions, possibleTypes);
  return TSUnionType(
    typeConditions
      .map(type => IfType(type.possibleTypes, typeForAnyObject(type)))
      .concat(
        remainingTypes.size > 0 ? [IfType(remainingTypes, emptyType)] : []
      )
  );
};

const typeForInlineSelection = (type: InlineSelection): TSType =>
  TSIntersectionType(
    [
      ...type.intersections.map(typeForFragmentReference),
      type.fields.length > 0
        ? TSTypeLiteral(type.fields.map(propertySignatureForField))
        : undefined,
      type.booleanConditions.length > 0
        ? PartialType(
            TSIntersectionType(type.booleanConditions.map(typeForAnyObject))
          )
        : undefined,
      type.typeConditions.length > 0
        ? TSParenthesizedType(
            unionTypeForTypeConditions(type.typeConditions, type.possibleTypes)
          )
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
  TSEnumDeclaration(
    identifier(type.name),
    type.getValues().map(enumMemberForGraphQLEnumValue)
  );

const propertySignatureForGraphQLInputField = (field: GraphQLInputField) => {
  const inputType = InputType(field.type);
  return {
    ...TSPropertySignature(
      identifier(field.name),
      TSTypeAnnotation(
        inputType.kind == "Maybe"
          ? MaybeType(typeForInputType(inputType.ofType))
          : typeForInputType(inputType)
      )
    ),
    optional: InputType(field.type).kind == "Maybe"
  };
};

const typeForGraphQLInputFieldMap = (map: GraphQLInputFieldMap) =>
  TSTypeLiteral(Object.values(map).map(propertySignatureForGraphQLInputField));

export const typeAliasDeclarationForGraphQLInputObjectType = (
  type: GraphQLInputObjectType
) =>
  TSTypeAliasDeclaration(
    identifier(type.name),
    undefined,
    typeForGraphQLInputFieldMap(type.getFields())
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

export const exportDeclaration = (expression: Declaration) =>
  exportNamedDeclaration(expression, []);

export const stringIdentifier = (fragmentOrOperationName: string): Identifier =>
  identifier(camelCase(fragmentOrOperationName + "String"));
