import { CompilerContext } from "apollo-codegen-core/lib/compiler";
import {
  InlineSelection,
  Typename,
  Maybe,
  List as ListType
} from "./intermediates";
import {
  Fragments,
  ExtendedSelection,
  ExtendedFieldType,
  ExtendedFields,
  ByTypename,
  ExtendedField,
  extendedSelectionsAreEqual
} from "./extendedIntermediates";
import { Map, List, Set } from "immutable";
import { isEqual } from "lodash";

type NormalizableSelections = ByTypename<List<ExtendedFields>>;

const normalizableSelectionsFromExtendedFieldType = (
  type: ExtendedFieldType
): NormalizableSelections => {
  switch (type.kind) {
    case "InlineSelection":
      return NormalizableSelections(type);
    case "Maybe":
      return normalizableSelectionsFromExtendedFieldType(type.ofType);
    case "List":
      return normalizableSelectionsFromExtendedFieldType(type.ofType);
    default:
      return Map();
  }
};

const selectTypename = (__typename: string) => (field: ExtendedField) =>
  field.type.kind == "Typename"
    ? { type: Typename(Set([__typename])), optional: field.optional }
    : field;

const NormalizableSelections = (
  selection: ExtendedSelection
): NormalizableSelections =>
  selection.fields.reduce(
    (normalizedSelections, fields, __typename) =>
      fields.reduce(
        (normalizedSelections, field) =>
          normalizedSelections.mergeDeep(
            normalizableSelectionsFromExtendedFieldType(field.type)
          ),
        isNormalizable(fields)
          ? normalizedSelections.mergeDeep(
              Map({
                [__typename]: List([fields.map(selectTypename(__typename))])
              })
            )
          : normalizedSelections
      ),
    Map()
  );

const normalizeFieldType = (type: ExtendedFieldType): ExtendedFieldType => {
  switch (type.kind) {
    case "InlineSelection":
      return normalizeSelection(type);
    case "Maybe":
      return Maybe(normalizeFieldType(type.ofType));
    case "List":
      return ListType(normalizeFieldType(type.ofType));
    default:
      return type;
  }
};

const normalizeField = ({ type, optional }: ExtendedField): ExtendedField => ({
  type: normalizeFieldType(type),
  optional
});

const normalizeSelection = (
  selection: ExtendedSelection
): ExtendedSelection => ({
  kind: "InlineSelection",
  fields: selection.fields.map(fields =>
    isNormalizable(fields)
      ? fields.filter(
          (_, fieldName) => fieldName == "__typename" || fieldName == "id"
        )
      : fields.map(normalizeField)
  )
});

const returnIfEqual = (
  __typename: string,
  fieldName: string,
  lhs: ExtendedFieldType,
  rhs: ExtendedFieldType
): ExtendedFieldType => {
  const differentKindsError = Error(
    `${lhs.kind} is not the same as ${rhs.kind}`
  );
  switch (lhs.kind) {
    case "Typename":
      if (rhs.kind != "Typename") {
        throw differentKindsError;
      }
      if (!lhs.possibleTypes.equals(rhs.possibleTypes)) {
        throw Error(
          `${lhs.possibleTypes} are not the same as ${rhs.possibleTypes}`
        );
      }
      return rhs;
    case "Enum":
      if (rhs.kind != "Enum") {
        throw differentKindsError;
      }
      if (lhs.name != rhs.name) {
        throw Error(`${lhs.name} is different than ${rhs.name}`);
      }
      if (!isEqual(lhs.values, rhs.values)) {
        throw Error(
          `Possible values ${lhs.values} are not the same as ${rhs.values}`
        );
      }
      return rhs;
    case "Scalar":
      if (rhs.kind != "Scalar") {
        throw differentKindsError;
      }
      if (lhs.name != rhs.name) {
        throw Error(`Types ${lhs.name} and ${rhs.name} are not the same`);
      }
      return rhs;
    case "InlineSelection":
      if (rhs.kind != "InlineSelection") {
        throw differentKindsError;
      }
      if (!extendedSelectionsAreEqual(lhs, rhs)) {
        throw Error(
          `${__typename} can't be normalized because it has conflicting definitions for "${fieldName}" that could lead to runtime bugs. Either alias the field name or make the selections the same.`
        );
      }
      return rhs;
    case "List":
      if (rhs.kind != "List") {
        throw differentKindsError;
      }
      return ListType(
        returnIfEqual(__typename, fieldName, lhs.ofType, rhs.ofType)
      );
    case "Maybe":
      if (rhs.kind != "Maybe") {
        throw differentKindsError;
      }
      return Maybe(
        returnIfEqual(__typename, fieldName, lhs.ofType, rhs.ofType)
      );
  }
};

const mergeExtendedSelections = (
  lhs: ExtendedSelection,
  rhs: ExtendedSelection
): ExtendedSelection => {
  return {
    kind: "InlineSelection",
    fields: lhs.fields.mergeWith(
      (lhs, rhs, __typename) => mergeFields(__typename)(lhs, rhs),
      rhs.fields
    )
  };
};

const isNormalizable = (fields: ExtendedFields) =>
  fields.has("__typename") && fields.has("id");

const mergeField = (__typename: string) => (
  lhs: ExtendedField,
  rhs: ExtendedField,
  fieldName: string
): ExtendedField => ({
  type:
    lhs.type.kind == "InlineSelection" &&
    rhs.type.kind == "InlineSelection" &&
    !lhs.type.fields.some(isNormalizable) &&
    !rhs.type.fields.some(isNormalizable)
      ? mergeExtendedSelections(lhs.type, rhs.type)
      : returnIfEqual(__typename, fieldName, lhs.type, rhs.type),
  optional: lhs.optional || rhs.optional
});

const mergeFields = (__typename: string) => (
  lhs: ExtendedFields,
  rhs: ExtendedFields
): ExtendedFields => {
  const intersection = Set(lhs.keySeq()).intersect(Set(rhs.keySeq()));
  return lhs
    .mergeWith(mergeField(__typename), rhs)
    .map((field, fieldName) =>
      !intersection.contains(fieldName)
        ? { type: field.type, optional: true }
        : field
    );
};

export const normalizedTypes = (context: CompilerContext) => {
  const fragments: Fragments = Object.values(context.fragments).reduce(
    (fragments, fragment) => ({
      ...fragments,
      [fragment.fragmentName]: InlineSelection(fragment.selectionSet)
    }),
    {}
  );
  const extendedSelections = Object.values(context.operations).map(operation =>
    ExtendedSelection(InlineSelection(operation.selectionSet), fragments)
  );
  const normalizableSelections = extendedSelections.reduce(
    (normalizedSelections, extendedSelection) =>
      normalizedSelections.mergeDeep(NormalizableSelections(extendedSelection)),
    Map() as NormalizableSelections
  );
  return normalizableSelections.map((fields, __typename) =>
    fields.reduce(mergeFields(__typename)).map(normalizeField)
  );
};
