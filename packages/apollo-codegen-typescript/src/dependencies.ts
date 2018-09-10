import { SelectionSet } from "apollo-codegen-core/lib/compiler";

import {
  InlineSelection,
  FragmentReference,
  OutputType,
  AnyObject,
  InputType
} from "./intermediates";

import { GraphQLType, GraphQLInputType } from "graphql";

import { Set } from "immutable";
import compact from "./compact";

type Dependency = {
  type: "fragment" | "global";
  name: string;
};

type Dependencies = {
  global: string[];
  fragments: string[];
};

const globalDependency = (name: string): Dependency => ({
  type: "global",
  name
});

const outputTypeDependencies = (type: OutputType): Dependency[] => {
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
  type: "fragment",
  name: reference.name
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

const anyObjectDependencies = (object: AnyObject): Dependency[] =>
  object.kind == "InlineSelection"
    ? inlineSelectionDependencies(object)
    : [fragmentReferenceDependency(object)];

const dedupedDependenciesOfType = (
  dependencies: Dependency[],
  type: "fragment" | "global"
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
): Dependency[] =>
  inlineSelectionDependencies(InlineSelection(selectionSet)).concat(
    variables
      ? variables
          .flatMap(variableDependencies)
          .concat(globalDependency("Operation"))
      : []
  );

const mapDependencies = (dependencies: Dependency[]): Dependencies => ({
  global: dedupedDependenciesOfType(dependencies, "global"),
  fragments: dedupedDependenciesOfType(dependencies, "fragment")
});

const Dependencies = (
  selectionSet: SelectionSet,
  variables?: { name: string; type: GraphQLType }[]
): Dependencies => mapDependencies(allDependencies(selectionSet, variables));

export default Dependencies;
