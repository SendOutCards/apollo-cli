import {
  InlineSelection,
  FragmentOrSelection,
  Field,
  OutputType,
  Typename,
  List,
  Maybe,
  Type,
  Leaf
} from "./intermediates";
import { Set, Map } from "immutable";
import { every } from "lodash";

export type Fragments = {
  [fragment: string]: InlineSelection;
};

type Curry<T, U, V> = (t: T) => (u: U) => V;

export type ExtendedFieldType = Type<ExtendedSelection | Leaf | Typename>;

const ExtendedFieldType: Curry<
  Fragments,
  OutputType | Typename,
  ExtendedFieldType
> = fragments => type => {
  switch (type.kind) {
    case "FragmentReference":
    case "InlineSelection":
      return ExtendedFragmentOrSelection(fragments)(type);
    case "List":
      return List(ExtendedFieldType(fragments)(type.ofType));
    case "Maybe":
      return Maybe(ExtendedFieldType(fragments)(type.ofType));
    default:
      return type;
  }
};

const typesAreEqual = (
  lhs: ExtendedFieldType,
  rhs: ExtendedFieldType
): boolean => {
  switch (lhs.kind) {
    case "Enum":
      return lhs.kind == rhs.kind && lhs.name == rhs.name;
    case "Typename":
      return (
        lhs.kind == rhs.kind && lhs.possibleTypes.equals(rhs.possibleTypes)
      );
    case "Scalar":
      return lhs.kind == rhs.kind && lhs.name == rhs.name;
    case "InlineSelection":
      return lhs.kind == rhs.kind && extendedSelectionsAreEqual(lhs, rhs);
    case "Maybe":
      return lhs.kind == rhs.kind && typesAreEqual(lhs.ofType, rhs.ofType);
    case "List":
      return lhs.kind == rhs.kind && typesAreEqual(lhs.ofType, rhs.ofType);
  }
};

export type ExtendedField = { type: ExtendedFieldType; optional: boolean };

const nameAndField: Curry<
  Fragments,
  Field,
  [fieldName, ExtendedField]
> = fragments => field => [
  field.name,
  { type: ExtendedFieldType(fragments)(field.type), optional: false }
];

export type __typename = string;
export type fieldName = string;
export type ByTypename<T> = Map<__typename, T>;
export type ExtendedFields = Map<fieldName, ExtendedField>;

export type ExtendedSelection = {
  kind: "InlineSelection";
  fields: ByTypename<ExtendedFields>;
};

export const ExtendedSelection = (
  inlineSelection: InlineSelection,
  fragments: Fragments
): ExtendedSelection => {
  return {
    kind: inlineSelection.kind,
    fields: Map(
      inlineSelection.possibleTypes.map(
        (
          type
        ): [
          __typename,
          Map<fieldName, { type: ExtendedFieldType; optional: boolean }>
        ] => [type, Map(inlineSelection.fields.map(nameAndField(fragments)))]
      )
    ).mergeDeep(
      ...inlineSelection.intersections
        .map(ExtendedFragmentOrSelection(fragments))
        .map(selection => selection.fields),
      ...inlineSelection.typeConditions
        .map(ExtendedFragmentOrSelection(fragments))
        .map(selection => selection.fields),
      ...inlineSelection.booleanConditions
        .map(ExtendedFragmentOrSelection(fragments))
        .map(selection => selection.fields)
    )
  };
};

export const ExtendedFragmentOrSelection: Curry<
  Fragments,
  FragmentOrSelection,
  ExtendedSelection
> = fragments => fragmentOrSelection =>
  fragmentOrSelection.kind == "InlineSelection"
    ? ExtendedSelection(fragmentOrSelection, fragments)
    : ExtendedSelection(fragments[fragmentOrSelection.name], fragments);

const mapsAreEqual = <V>(
  lhs: Map<string, V>,
  rhs: Map<string, V>,
  compareValues: (lhs: V, rhs: V) => boolean
): boolean =>
  Set(lhs.keySeq()).equals(Set(rhs.keySeq())) &&
  every(lhs.keySeq().toArray(), key =>
    compareValues(lhs.get(key)!, rhs.get(key)!)
  );

const extendedFieldsAreEqual = (
  lhs: ByTypename<ExtendedFields>,
  rhs: ByTypename<ExtendedFields>
): boolean =>
  mapsAreEqual(lhs, rhs, (lhs, rhs) =>
    mapsAreEqual(
      lhs,
      rhs,
      (lhs, rhs) =>
        lhs.optional == rhs.optional && typesAreEqual(lhs.type, rhs.type)
    )
  );

export const extendedSelectionsAreEqual = (
  lhs: ExtendedSelection,
  rhs: ExtendedSelection
): boolean => extendedFieldsAreEqual(lhs.fields, rhs.fields);
