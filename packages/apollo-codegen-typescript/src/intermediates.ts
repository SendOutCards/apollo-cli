import {
  SelectionSet,
  Selection,
  Field as CompilerField
} from "apollo-codegen-core/lib/compiler";

import { Set } from "immutable";
import {
  GraphQLOutputType,
  isNonNullType,
  GraphQLNonNull,
  isListType,
  isEnumType,
  GraphQLList,
  GraphQLInputType,
  isInputObjectType,
  GraphQLLeafType,
  isCompositeType,
  GraphQLEnumType
} from "graphql";

export type List<T> = {
  kind: "List";
  ofType: T;
};

export type Maybe<T> = {
  kind: "Maybe";
  ofType: T;
};

export type Typename = {
  kind: "Typename";
  possibleTypes: Set<string>;
};
export const Typename = (possibleTypes: Set<string>): Typename => ({
  kind: "Typename",
  possibleTypes
});

export type Field = {
  name: string;
  type: OutputType | Typename;
};

export type FragmentReference = {
  kind: "FragmentReference";
  name: string;
  possibleTypes: Set<string>;
};

export type InlineSelection = {
  kind: "InlineSelection";
  possibleTypes: Set<string>;
  intersections: FragmentReference[];
  fields: Field[];
  booleanConditions: FragmentOrSelection[];
  typeConditions: FragmentOrSelection[];
};

export type FragmentOrSelection = FragmentReference | InlineSelection;

export type InputObject = {
  kind: "InputObject";
  name: string;
};

export type Enum = {
  kind: "Enum";
  name: string;
  values: string[];
};

export type Scalar = {
  kind: "Scalar";
  name: string;
  isTypename: boolean;
};

export type Leaf = Enum | Scalar;

export interface MaybeType<T> extends Maybe<Type<T>> {}

export interface ListType<T> extends List<Type<T>> {}

export type Type<T> = T | MaybeType<T> | ListType<T>;

export type OutputType = Type<FragmentOrSelection | Leaf>;

export type InputType = Type<InputObject | Leaf>;

export const List = <T>(ofType: T): List<T> => ({ kind: "List", ofType });

export const Maybe = <T>(ofType: T): Maybe<T> => ({ kind: "Maybe", ofType });

const InputObject = (name: string): InputObject => ({
  kind: "InputObject",
  name
});

const Enum = (type: GraphQLEnumType): Enum => ({
  kind: "Enum",
  name: type.name,
  values: type.getValues().map(value => value.value)
});

const Scalar = (name: string, isTypeName?: boolean): Scalar => ({
  kind: "Scalar",
  name,
  isTypename: isTypeName || false
});

const Leaf = (type: GraphQLLeafType): Leaf =>
  isEnumType(type) ? Enum(type) : Scalar(type.name);

const fail = (message: string): any => {
  throw Error(message);
};

const FragmentOrSelectionOrLeaf = (
  type: Exclude<GraphQLOutputType, GraphQLList<any> | GraphQLNonNull<any>>,
  selection?: InlineSelection
): FragmentOrSelection | Leaf =>
  selection
    ? selection
    : isCompositeType(type)
      ? fail("Composite type without selection.")
      : Leaf(type);

const NonListOutputType = (
  type: Exclude<GraphQLOutputType, GraphQLList<any>>,
  selection?: InlineSelection
): OutputType =>
  isNonNullType(type)
    ? FragmentOrSelectionOrLeaf(type.ofType, selection)
    : Maybe(FragmentOrSelectionOrLeaf(type, selection));

const NonNullOutputType = (
  type: Exclude<GraphQLOutputType, GraphQLNonNull<any>>,
  selection?: InlineSelection
): OutputType =>
  isListType(type)
    ? List(NonListOutputType(type.ofType, selection))
    : FragmentOrSelectionOrLeaf(type, selection);

const OutputType = (
  type: GraphQLOutputType,
  selection?: InlineSelection
): OutputType =>
  isNonNullType(type)
    ? NonNullOutputType(type.ofType, selection)
    : Maybe(NonNullOutputType(type, selection));

const InputObjectOrLeaf = (
  type: Exclude<GraphQLInputType, GraphQLList<any> | GraphQLNonNull<any>>
): InputObject | Leaf =>
  isInputObjectType(type) ? InputObject(type.name) : Leaf(type);

const NonListInputType = (
  type: Exclude<GraphQLInputType, GraphQLList<any>>
): InputType =>
  isNonNullType(type)
    ? InputObjectOrLeaf(type.ofType)
    : Maybe(InputObjectOrLeaf(type));

const NonNullInputType = (
  type: Exclude<GraphQLInputType, GraphQLNonNull<any>>
): InputType =>
  isListType(type)
    ? List(NonListInputType(type.ofType))
    : InputObjectOrLeaf(type);

export const InputType = (type: GraphQLInputType): InputType =>
  isNonNullType(type)
    ? NonNullInputType(type.ofType)
    : Maybe(NonNullInputType(type));

const Field = (field: CompilerField, possibleTypes: Set<string>): Field => ({
  name: field.alias ? field.alias : field.name,
  type:
    field.name == "__typename"
      ? Typename(possibleTypes)
      : OutputType(
          field.type,
          field.selectionSet && InlineSelection(field.selectionSet)
        )
});

export const FragmentReference = (
  name: string,
  possibleTypes: Set<string>
): FragmentReference => ({
  kind: "FragmentReference",
  name,
  possibleTypes
});

export const InlineSelection = (
  selectionSet: SelectionSet
): InlineSelection => {
  const emptyType: InlineSelection = {
    kind: "InlineSelection",
    possibleTypes: Set(selectionSet.possibleTypes.map(type => type.name)),
    intersections: [],
    fields: [],
    booleanConditions: [],
    typeConditions: []
  };
  return selectionSet.selections.reduce(
    (type: InlineSelection, selection: Selection) => {
      switch (selection.kind) {
        case "Field":
          return {
            ...type,
            fields: [...type.fields, Field(selection, type.possibleTypes)]
          };
        case "BooleanCondition":
          return {
            ...type,
            booleanConditions: [
              ...type.booleanConditions,
              AnyObject(selection.selectionSet)
            ]
          };
        case "TypeCondition":
          const conditionalType = AnyObject(selection.selectionSet);
          return conditionalType.possibleTypes.equals(type.possibleTypes)
            ? conditionalType.kind == "FragmentReference"
              ? {
                  ...type,
                  intersections: [...type.intersections, conditionalType]
                }
              : {
                  ...type,
                  intersections: type.intersections.concat(
                    conditionalType.intersections
                  ),
                  fields: type.fields.concat(conditionalType.fields),
                  booleanConditions: type.booleanConditions.concat(
                    conditionalType.booleanConditions
                  ),
                  typeConditions: type.typeConditions.concat(
                    conditionalType.typeConditions
                  )
                }
            : {
                ...type,
                typeConditions: [...type.typeConditions, conditionalType]
              };
        case "FragmentSpread":
          const possibleTypes = Set(
            selection.selectionSet.possibleTypes.map(type => type.name)
          );
          const fragmentType = FragmentReference(
            selection.fragmentName,
            possibleTypes
          );
          return possibleTypes.isSuperset(type.possibleTypes)
            ? { ...type, intersections: [...type.intersections, fragmentType] }
            : {
                ...type,
                typeConditions: [...type.typeConditions, fragmentType]
              };
      }
    },
    emptyType
  );
};

export const AnyObject = (selectionSet: SelectionSet): FragmentOrSelection => {
  const unnamed = InlineSelection(selectionSet);
  return unnamed.intersections.length == 1 &&
    unnamed.fields.length == 0 &&
    unnamed.booleanConditions.length == 0 &&
    unnamed.typeConditions.length == 0
    ? unnamed.intersections[0]
    : unnamed;
};
