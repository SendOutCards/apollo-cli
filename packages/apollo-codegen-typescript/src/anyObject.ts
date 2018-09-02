import { SelectionSet, Selection, Field as CompilerField } from 'apollo-codegen-core/lib/compiler';

import { Set } from 'immutable';
import { GraphQLOutputType, isNonNullType, GraphQLNonNull, isListType, isEnumType } from 'graphql';

export type List = {
  kind: 'List';
  ofType: OutputType;
};

export type Maybe = {
  kind: 'Maybe';
  ofType: OutputType;
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

export type Enum = {
  kind: 'Enum';
  name: string;
};

export type Scalar = {
  kind: 'Scalar';
  name: string;
};

export type OutputType = List | Maybe | AnyObject | Enum | Scalar;

const List = (ofType: OutputType): List => ({ kind: 'List', ofType });

const Maybe = (ofType: OutputType): Maybe => ({ kind: 'Maybe', ofType });

const Enum = (name: string): Enum => ({ kind: 'Enum', name });

const Scalar = (name: string): Scalar => ({ kind: 'Scalar', name });

const typeIgnoringNonNull = (
  type: Exclude<GraphQLOutputType, GraphQLNonNull<any>>,
  selection?: InlineSelection
): OutputType =>
  isListType(type)
    ? List(OutputType(type.ofType, selection))
    : selection != undefined
      ? selection
      : isEnumType(type)
        ? Enum(type.name)
        : Scalar(type.name);

const OutputType = (type: GraphQLOutputType, selection?: InlineSelection): OutputType =>
  isNonNullType(type)
    ? typeIgnoringNonNull(type.ofType, selection)
    : Maybe(typeIgnoringNonNull(type, selection));

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
