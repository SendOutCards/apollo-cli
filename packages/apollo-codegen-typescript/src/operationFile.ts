import { Printable } from './printer';
import { Operation, CompilerContext } from 'apollo-codegen-core/lib/compiler';

import {
  rawStringImportDeclaration,
  exportDeclaration,
  typeAliasDeclarationForOperation,
  stringDeclaration
} from './types';

import { constructorDeclarationForOperation } from './constructors';

import Dependencies from './dependencies';
import dependencyImports from './dependencyImports';

export const operationFile = (
  operation: Operation,
  outputPath: string,
  globalSourcePath: string,
  context: CompilerContext
): Printable[] =>
  ((dependencies: Dependencies) => [
    ...dependencyImports(dependencies, outputPath, globalSourcePath, context),
    rawStringImportDeclaration(operation.operationName, operation.filePath, outputPath),
    stringDeclaration(operation.operationName, dependencies.fragments),
    exportDeclaration(typeAliasDeclarationForOperation(operation)),
    exportDeclaration(constructorDeclarationForOperation(operation))
  ])(Dependencies(operation.selectionSet, operation.variables));
