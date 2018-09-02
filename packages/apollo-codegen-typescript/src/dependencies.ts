import { SelectionSet } from 'apollo-codegen-core/lib/compiler';

import { InlineSelection, FragmentReference, OutputType, AnyObject } from './anyObject';

import { Set } from 'immutable';

type Dependency = {
  type: 'fragment' | 'global';
  name: string;
};

const globalDependency = (name: string): Dependency => ({ type: 'global', name });

const outputTypeDependencies = (type: OutputType): Dependency[] => {
  switch (type.kind) {
    case 'Maybe':
      return [globalDependency('Maybe'), ...outputTypeDependencies(type.ofType)];
    case 'List':
      return outputTypeDependencies(type.ofType);
    case 'FragmentReference':
      return [fragmentReferenceDependency(type)];
    case 'InlineSelection':
      return inlineSelectionDependencies(type);
    case 'Enum':
      return [globalDependency(type.name)];
    case 'Scalar':
      return [];
  }
};

const fragmentReferenceDependency = (reference: FragmentReference): Dependency => ({
  type: 'fragment',
  name: reference.name
});

const inlineSelectionDependencies = (selection: InlineSelection): Dependency[] => [
  ...selection.intersections.map(fragmentReferenceDependency),
  ...selection.fields.flatMap(field => outputTypeDependencies(field.type)),
  ...selection.booleanConditions.flatMap(anyObjectDependencies),
  ...selection.typeConditions.flatMap(anyObjectDependencies)
];

const anyObjectDependencies = (object: AnyObject): Dependency[] =>
  object.kind == 'InlineSelection'
    ? inlineSelectionDependencies(object)
    : [fragmentReferenceDependency(object)];

const dedupedDependenciesOfType = (dependencies: Dependency[], type: 'fragment' | 'global'): string[] =>
  Set(
    dependencies.filter(dependency => dependency.type == type).map(dependency => dependency.name)
  ).toArray();

const selectionSetDependenciesOfType = (selectionSet: SelectionSet, type: 'fragment' | 'global'): string[] =>
  dedupedDependenciesOfType(inlineSelectionDependencies(InlineSelection(selectionSet)), type);

export const selectionSetGlobalDependencies = (selectionSet: SelectionSet): string[] =>
  selectionSetDependenciesOfType(selectionSet, 'global');

export const selectionSetFragmentDependencies = (selectionSet: SelectionSet): string[] =>
  selectionSetDependenciesOfType(selectionSet, 'fragment');
