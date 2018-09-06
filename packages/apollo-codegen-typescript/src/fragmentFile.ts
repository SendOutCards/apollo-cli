import { Printable } from './printer';
import {
  importDeclarationsForDependencies,
  rawStringImportDeclaration,
  stringDeclaration,
  exportDeclaration,
  typeAliasDeclarationForFragment
} from './types';

import Dependencies from './dependencies';

import { Fragment, CompilerContext } from 'apollo-codegen-core/lib/compiler';

export const fragmentFile = (
  fragment: Fragment,
  outputPath: string,
  globalSourcePath: string,
  context: CompilerContext
): Printable[] =>
  ((dependencies: Dependencies) => [
    ...importDeclarationsForDependencies(dependencies, outputPath, globalSourcePath, context),
    rawStringImportDeclaration(fragment.fragmentName, fragment.filePath, outputPath),
    exportDeclaration(stringDeclaration(fragment.fragmentName, dependencies.fragments)),
    exportDeclaration(typeAliasDeclarationForFragment(fragment))
  ])(Dependencies(fragment.selectionSet));
