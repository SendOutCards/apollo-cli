import { Printable } from './printer';
import { Operation, CompilerContext } from 'apollo-codegen-core/lib/compiler';
import {
  rawStringImportDeclaration,
  exportDeclaration,
  typeAliasDeclarationForOperation,
  variableDeclarationForOperation,
  importDeclarationsForDependencies,
  stringDeclaration
} from './types';
import Dependencies from './dependencies';

export const operationFile = (
  operation: Operation,
  outputPath: string,
  globalSourcePath: string,
  context: CompilerContext
): Printable[] =>
  ((dependencies: Dependencies) => [
    ...importDeclarationsForDependencies(dependencies, outputPath, globalSourcePath, context),
    rawStringImportDeclaration(operation.operationName, operation.filePath, outputPath),
    stringDeclaration(operation.operationName, dependencies.fragments),
    exportDeclaration(typeAliasDeclarationForOperation(operation)),
    exportDeclaration(variableDeclarationForOperation(operation))
  ])(Dependencies(operation.selectionSet, operation.variables));
