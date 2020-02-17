import { Printable } from "./printer";
import { Operation, CompilerContext } from "apollo-codegen-core/lib/compiler";

import {
  exportDeclaration,
  typeAliasDeclarationForOperation as typeAliasDeclarationForOperationData,
  typeAliasDeclarationForOperationVariables,
  operationTypeAlias
} from "./types";

import { constructorDeclarationForOperation } from "./constructors";

import Dependencies from "./dependencies";
import dependencyImports from "./dependencyImports";
import stringDeclarations from "./stringDeclarations";
import compact from "./compact";

export const operationFile = (
  operation: Operation,
  outputPath: string,
  globalSourcePath: string,
  context: CompilerContext
): Printable[] => {
  const dependencies = Dependencies(
    operation.selectionSet,
    operation.variables
  );
  return compact(
    ...dependencyImports(dependencies, outputPath, globalSourcePath, context),
    ...stringDeclarations(
      operation.operationName,
      operation.filePath,
      outputPath,
      dependencies.fragments.map(fragmentDependency => fragmentDependency.name)
    ),
    exportDeclaration(typeAliasDeclarationForOperationData(operation)),
    operation.variables.length > 0 &&
      exportDeclaration(typeAliasDeclarationForOperationVariables(operation)),
    exportDeclaration(operationTypeAlias(operation)),
    exportDeclaration(constructorDeclarationForOperation(operation))
  );
};
