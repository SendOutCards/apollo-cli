import { SelectionSet, Selection } from "apollo-codegen-core/lib/compiler";

import {
  InlineSelection,
  FragmentReference,
  OutputType,
  FragmentOrSelection,
  InputType,
  Typename
} from "./intermediates";

import { GraphQLType, GraphQLInputType } from "graphql";

import { Set } from "immutable";
import compact from "./compact";

type Dependency = {
  type: "fragment-type" | "fragment-string" | "global";
  name: string;
};

export type FragmentDependency = {
  name: string;
  importType: boolean;
  importString: boolean;
};

type Dependencies = {
  global: string[];
  fragments: FragmentDependency[];
};

const globalDependency = (name: string): Dependency => ({
  type: "global",
  name
});

const outputTypeDependencies = (type: OutputType | Typename): Dependency[] => {
  switch (type.kind) {
    case "Maybe":
      return [
        globalDependency("Maybe"),
        ...outputTypeDependencies(type.ofType)
      ];
    case "List":
      return outputTypeDependencies(type.ofType);
    case "FragmentReference":
      return [fragmentReferenceDependency(type)];
    case "InlineSelection":
      return inlineSelectionDependencies(type);
    case "Enum":
      return [globalDependency(type.name)];
    case "Scalar":
      return [];
    case "Typename":
      return [];
  }
};

const inputTypeDependencies = (type: InputType): Dependency[] => {
  switch (type.kind) {
    case "Maybe":
      return [
        globalDependency("Optional"),
        ...inputTypeDependencies(type.ofType)
      ];
    case "List":
      return inputTypeDependencies(type.ofType);
    case "InputObject":
      return [globalDependency(type.name)];
    case "Enum":
      return [globalDependency(type.name)];
    case "Scalar":
      return [];
  }
};

const fragmentReferenceDependency = (
  reference: FragmentReference
): Dependency => ({
  type: "fragment-type",
  name: reference.name
});

const fragmentStringDependency = (name: string): Dependency => ({
  type: "fragment-string",
  name
});

const inlineSelectionDependencies = (
  selection: InlineSelection
): Dependency[] =>
  compact(
    ...selection.intersections.map(fragmentReferenceDependency),
    ...selection.fields.flatMap(field => outputTypeDependencies(field.type)),
    ...selection.booleanConditions.flatMap(anyObjectDependencies),
    ...selection.typeConditions.flatMap(anyObjectDependencies),
    selection.typeConditions.length > 0 && globalDependency("If")
  );

const selectionFragmentStringDependencies = (
  selection: Selection
): Dependency[] =>
  compact(
    selection.kind == "FragmentSpread" &&
      fragmentStringDependency(selection.fragmentName),
    ...(selection.selectionSet
      ? selection.selectionSet.selections.flatMap(
          selectionFragmentStringDependencies
        )
      : [])
  );

const anyObjectDependencies = (object: FragmentOrSelection): Dependency[] =>
  object.kind == "InlineSelection"
    ? inlineSelectionDependencies(object)
    : [fragmentReferenceDependency(object)];

const dedupedDependenciesOfType = (
  dependencies: Dependency[],
  type: "fragment-type" | "fragment-string" | "global"
): string[] =>
  Set(
    dependencies
      .filter(dependency => dependency.type == type)
      .map(dependency => dependency.name)
  ).toArray();

const variableDependencies = (variable: {
  name: string;
  type: GraphQLType;
}): Dependency[] =>
  inputTypeDependencies(InputType(variable.type as GraphQLInputType));

const allDependencies = (
  selectionSet: SelectionSet,
  variables?: { name: string; type: GraphQLType }[]
): Dependency[] => [
  ...inlineSelectionDependencies(InlineSelection(selectionSet)),
  ...(variables
    ? [
        ...variables.flatMap(variableDependencies),
        ...selectionSet.selections.flatMap(selectionFragmentStringDependencies),
        globalDependency("Operation")
      ]
    : [])
];

const fragmentDependencies = (
  dependencies: Dependency[]
): FragmentDependency[] => {
  const fragmentTypes = Set(
    dependencies
      .filter(dependency => dependency.type == "fragment-type")
      .map(dependency => dependency.name)
  );
  let fragmentStrings = Set(
    dependencies
      .filter(dependency => dependency.type == "fragment-string")
      .map(dependency => dependency.name)
  );
  return fragmentTypes
    .map(fragmentType => {
      const importString = fragmentStrings.contains(fragmentType!);
      fragmentStrings = fragmentStrings.remove(fragmentType!);
      return { name: fragmentType!, importType: true, importString };
    })
    .toArray()
    .concat(
      fragmentStrings
        .map(fragmentString => ({
          name: fragmentString!,
          importType: false,
          importString: true
        }))
        .toArray()
    );
};

const mapDependencies = (dependencies: Dependency[]): Dependencies => ({
  global: dedupedDependenciesOfType(dependencies, "global"),
  fragments: fragmentDependencies(dependencies)
});

const Dependencies = (
  selectionSet: SelectionSet,
  variables?: { name: string; type: GraphQLType }[]
): Dependencies => mapDependencies(allDependencies(selectionSet, variables));

export default Dependencies;
