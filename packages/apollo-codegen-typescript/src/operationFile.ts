import { Printable } from './printer';
import { Operation, CompilerContext } from 'apollo-codegen-core/lib/compiler';

import { exportDeclaration, typeAliasDeclarationForOperation } from './types';

import { constructorDeclarationForOperation } from './constructors';

import Dependencies from './dependencies';
import dependencyImports from './dependencyImports';
import stringDeclarations from './stringDeclarations';

export const operationFile = (
  operation: Operation,
  outputPath: string,
  globalSourcePath: string,
  context: CompilerContext
): Printable[] =>
  ((dependencies: Dependencies) => [
    ...dependencyImports(dependencies, outputPath, globalSourcePath, context),
    ...stringDeclarations(operation.operationName, operation.filePath, outputPath, dependencies.fragments),
    exportDeclaration(typeAliasDeclarationForOperation(operation)),
    exportDeclaration(constructorDeclarationForOperation(operation))
  ])(Dependencies(operation.selectionSet, operation.variables));
