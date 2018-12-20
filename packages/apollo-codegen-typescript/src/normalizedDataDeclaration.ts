import { normalizedTypes } from "./normalization";
import { CompilerContext } from "apollo-codegen-core/lib/compiler";
import {
  identifier,
  TSTypeAliasDeclaration,
  TSPropertySignature,
  TSTypeAnnotation,
  TSTypeLiteral,
  TSType,
  TSArrayType,
  TSUnionType,
  objectProperty,
  objectExpression
} from "@babel/types";
import {
  ExtendedFields,
  ExtendedField,
  ExtendedFieldType,
  ExtendedSelection
} from "./extendedIntermediates";
import { MaybeType, ByIdType } from "./genericTypes";
import { typeReference, typeForScalar, typeForTypename } from "./types";
import { constructorDeclaration } from "./constructors";

const typeForExtendedFields = (fields: ExtendedFields): TSType =>
  TSTypeLiteral([...fields.map(propertySignatureForExtendedField).values()]);

const typeForExtendedSelection = (selection: ExtendedSelection): TSType =>
  TSUnionType([...selection.fields.map(typeForExtendedFields).values()]);

const typeForExtendedFieldType = (type: ExtendedFieldType): TSType => {
  switch (type.kind) {
    case "InlineSelection":
      return typeForExtendedSelection(type);
    case "List":
      return TSArrayType(typeForExtendedFieldType(type.ofType));
    case "Maybe":
      return MaybeType(typeForExtendedFieldType(type.ofType));
    case "Enum":
      return typeReference(type.name);
    case "Scalar":
      return typeForScalar(type);
    case "Typename":
      return typeForTypename(type);
  }
};

const propertySignatureForExtendedField = (
  field: ExtendedField,
  fieldName: string
): TSPropertySignature => {
  return {
    ...TSPropertySignature(
      identifier(fieldName),
      TSTypeAnnotation(typeForExtendedFieldType(field.type))
    ),
    optional: field.optional
  };
};

const normalizedDeclaration = (fields: ExtendedFields, __typename: String) =>
  TSTypeAliasDeclaration(
    identifier(`Normalized${__typename}`),
    undefined,
    typeForExtendedFields(fields)
  );

export const normalizedDataDeclarations = (context: CompilerContext) => {
  const types = normalizedTypes(context);
  return [
    ...types.map(normalizedDeclaration).values(),
    TSTypeAliasDeclaration(
      identifier("NormalizedData"),
      undefined,
      TSTypeLiteral(
        types
          .keySeq()
          .map(__typename =>
            TSPropertySignature(
              identifier(__typename),
              TSTypeAnnotation(
                ByIdType(typeReference(`Normalized${__typename}`))
              )
            )
          )
          .toArray()
      )
    ),
    constructorDeclaration(
      "NormalizedData",
      [],
      typeReference("NormalizedData"),
      types
        .keySeq()
        .map(__typename =>
          objectProperty(identifier(__typename), objectExpression([]))
        )
        .toArray()
    )
  ];
};
