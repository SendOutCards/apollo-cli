import { SelectionSet, Selection, Field as CompilerField } from 'apollo-codegen-core/lib/compiler';

import { Set } from 'immutable';
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
  isCompositeType
} from 'graphql';

export type List<T> = {
  kind: 'List';
  ofType: T;
};

export type Maybe<T> = {
  kind: 'Maybe';
  ofType: T;
};

export type Field = {
  name: string;
  type: OutputType;
};

export type FragmentReference = {
  kind: 'FragmentReference';
  name: string;
  possibleTypes: Set<string>;
};

export type InlineSelection = {
  kind: 'InlineSelection';
  possibleTypes: Set<string>;
  intersections: FragmentReference[];
  fields: Field[];
  booleanConditions: AnyObject[];
  typeConditions: AnyObject[];
};

export type AnyObject = FragmentReference | InlineSelection;

export type InputObject = {
  kind: 'InputObject';
  name: string;
};

export type Enum = {
  kind: 'Enum';
  name: string;
};

export type Scalar = {
  kind: 'Scalar';
  name: string;
};

type Leaf = Enum | Scalar;

type NonListType<T> = Maybe<T> | T;

type NonNullType<T> = List<NonListType<T>> | T;

type Type<T> = Maybe<NonNullType<T>> | NonNullType<T>;

export type OutputType = Type<AnyObject | Leaf>;

export type InputType = Type<InputObject | Leaf>;

const List = <T>(ofType: T): List<T> => ({ kind: 'List', ofType });

const Maybe = <T>(ofType: T): Maybe<T> => ({ kind: 'Maybe', ofType });

const InputObject = (name: string): InputObject => ({ kind: 'InputObject', name });

const Enum = (name: string): Enum => ({ kind: 'Enum', name });

const Scalar = (name: string): Scalar => ({ kind: 'Scalar', name });

const Leaf = (type: GraphQLLeafType): Leaf => (isEnumType(type) ? Enum(type.name) : Scalar(type.name));

const fail = (message: string): any => {
  throw Error(message);
};

const AnyObjectOrLeaf = (
  type: Exclude<GraphQLOutputType, GraphQLList<any> | GraphQLNonNull<any>>,
  selection?: InlineSelection
): AnyObject | Leaf =>
  selection ? selection : isCompositeType(type) ? fail('Composite type without selection.') : Leaf(type);

const NonListOutputType = (
  type: Exclude<GraphQLOutputType, GraphQLList<any>>,
  selection?: InlineSelection
): NonListType<AnyObject | Leaf> =>
  isNonNullType(type) ? AnyObjectOrLeaf(type.ofType, selection) : Maybe(AnyObjectOrLeaf(type, selection));

const NonNullOutputType = (
  type: Exclude<GraphQLOutputType, GraphQLNonNull<any>>,
  selection?: InlineSelection
): NonNullType<AnyObject | Leaf> =>
  isListType(type) ? List(NonListOutputType(type.ofType, selection)) : AnyObjectOrLeaf(type, selection);

const OutputType = (type: GraphQLOutputType, selection?: InlineSelection): OutputType =>
  isNonNullType(type) ? NonNullOutputType(type.ofType, selection) : Maybe(NonNullOutputType(type, selection));

const InputObjectOrLeaf = (
  type: Exclude<GraphQLInputType, GraphQLList<any> | GraphQLNonNull<any>>
): InputObject | Leaf => (isInputObjectType(type) ? InputObject(type.name) : Leaf(type));

const NonListInputType = (
  type: Exclude<GraphQLInputType, GraphQLList<any>>
): NonListType<InputObject | Leaf> =>
  isNonNullType(type) ? InputObjectOrLeaf(type.ofType) : Maybe(InputObjectOrLeaf(type));

const NonNullInputType = (
  type: Exclude<GraphQLInputType, GraphQLNonNull<any>>
): NonNullType<InputObject | Leaf> =>
  isListType(type) ? List(NonListInputType(type.ofType)) : InputObjectOrLeaf(type);

export const InputType = (type: GraphQLInputType): InputType =>
  isNonNullType(type) ? NonNullInputType(type.ofType) : Maybe(NonNullInputType(type));

const Field = (field: CompilerField): Field => ({
  name: field.alias ? field.alias : field.name,
  type: OutputType(field.type, field.selectionSet && InlineSelection(field.selectionSet))
});

export const FragmentReference = (name: string, possibleTypes: Set<string>): FragmentReference => ({
  kind: 'FragmentReference',
  name,
  possibleTypes
});

export const InlineSelection = (selectionSet: SelectionSet): InlineSelection => {
  const emptyType: InlineSelection = {
    kind: 'InlineSelection',
    possibleTypes: Set(selectionSet.possibleTypes.map(type => type.name)),
    intersections: [],
    fields: [],
    booleanConditions: [],
    typeConditions: []
  };
  return selectionSet.selections.reduce((type: InlineSelection, selection: Selection) => {
    switch (selection.kind) {
      case 'Field':
        return { ...type, fields: [...type.fields, Field(selection)] };
      case 'BooleanCondition':
        return {
          ...type,
          booleanConditions: [...type.booleanConditions, AnyObject(selection.selectionSet)]
        };
      case 'TypeCondition':
        const conditionalType = AnyObject(selection.selectionSet);
        return conditionalType.possibleTypes.equals(type.possibleTypes)
          ? conditionalType.kind == 'FragmentReference'
            ? { ...type, intersections: [...type.intersections, conditionalType] }
            : {
                ...type,
                intersections: type.intersections.concat(conditionalType.intersections),
                fields: type.fields.concat(conditionalType.fields),
                booleanConditions: type.booleanConditions.concat(conditionalType.booleanConditions),
                typeConditions: type.typeConditions.concat(conditionalType.typeConditions)
              }
          : { ...type, typeConditions: [...type.typeConditions, conditionalType] };
      case 'FragmentSpread':
        const possibleTypes = Set(selection.selectionSet.possibleTypes.map(type => type.name));
        const fragmentType = FragmentReference(selection.fragmentName, possibleTypes);
        return possibleTypes.isSuperset(type.possibleTypes)
          ? { ...type, intersections: [...type.intersections, fragmentType] }
          : {
              ...type,
              typeConditions: [...type.typeConditions, fragmentType]
            };
    }
  }, emptyType);
};

export const AnyObject = (selectionSet: SelectionSet): AnyObject => {
  const unnamed = InlineSelection(selectionSet);
  return unnamed.intersections.length == 1 &&
    unnamed.fields.length == 0 &&
    unnamed.booleanConditions.length == 0 &&
    unnamed.typeConditions.length == 0
    ? unnamed.intersections[0]
    : unnamed;
};
