import { Printable } from "./printer";
import { exportDeclaration, typeAliasDeclarationForFragment } from "./types";

import Dependencies from "./dependencies";
import dependencyImports from "./dependencyImports";

import { Fragment, CompilerContext } from "apollo-codegen-core/lib/compiler";
import stringDeclarations from "./stringDeclarations";
import { isFragmentDeclaration } from "./typePredicates";

export const fragmentFile = (
  fragment: Fragment,
  outputPath: string,
  globalSourcePath: string,
  context: CompilerContext
): Printable[] => [
  ...dependencyImports(
    Dependencies(fragment.selectionSet),
    outputPath,
    globalSourcePath,
    context
  ),
  ...stringDeclarations(
    fragment.fragmentName,
    fragment.filePath,
    outputPath,
    [],
    true
  ),
  exportDeclaration(typeAliasDeclarationForFragment(fragment)),
  exportDeclaration(isFragmentDeclaration(fragment))
];
