import { CompilerContext } from "apollo-codegen-core/lib/compiler";
import Dependencies, { FragmentDependency } from "./dependencies";
import {
  ImportDeclaration,
  importDeclaration,
  stringLiteral,
  ImportSpecifier,
  importSpecifier,
  Identifier,
  identifier
} from "@babel/types";
import { stringIdentifier } from "./types";
import { relativePath, outputPath } from "./paths";
import compact from "./compact";

const stringImportSpecifier = (fragmentName: string): ImportSpecifier =>
  importSpecifierWithIdentifier(stringIdentifier(fragmentName));

const importSpecifierWithIdentifier = (
  identifier: Identifier
): ImportSpecifier => importSpecifier(identifier, identifier);

const importDeclarationForFragmentDependency = (
  fragmentDependency: FragmentDependency,
  context: CompilerContext,
  filePath: string
): ImportDeclaration =>
  importDeclaration(
    compact(
      fragmentDependency.importType &&
        importSpecifierWithIdentifier(identifier(fragmentDependency.name)),
      fragmentDependency.importString &&
        stringImportSpecifier(fragmentDependency.name)
    ),
    stringLiteral(
      relativePath(
        filePath,
        outputPath(
          fragmentDependency.name,
          context.fragments[fragmentDependency.name].filePath
        )
      )
    )
  );

const importDeclarationForGlobalDependencies = (
  dependencies: string[],
  relativeGlobalSourcePath: string
): ImportDeclaration =>
  importDeclaration(
    dependencies.map(dependency =>
      importSpecifierWithIdentifier(identifier(dependency))
    ),
    stringLiteral(relativeGlobalSourcePath)
  );

export default (
  dependencies: Dependencies,
  outputPath: string,
  globalSourcePath: string,
  context: CompilerContext
): ImportDeclaration[] =>
  compact(
    dependencies.global.length > 0 &&
      importDeclarationForGlobalDependencies(
        dependencies.global,
        relativePath(outputPath, globalSourcePath)
      ),
    ...dependencies.fragments.map(fragmentDependency =>
      importDeclarationForFragmentDependency(
        fragmentDependency,
        context,
        outputPath
      )
    )
  );
