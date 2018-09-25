import {
  Declaration,
  importDeclaration,
  Identifier,
  identifier,
  importDefaultSpecifier,
  stringLiteral,
  variableDeclaration,
  variableDeclarator,
  callExpression,
  memberExpression,
  arrayExpression
} from "@babel/types";
import { stringIdentifier, exportDeclaration } from "./types";
import { camelCase } from "lodash";
import { relativePath } from "./paths";
import compact from "./compact";

const rawStringIdentifier = (fragmentOrOperationName: string): Identifier =>
  identifier(camelCase(fragmentOrOperationName + "RawString"));

const importDeclarationWithIdentifier = (
  identifier: Identifier,
  source: string
): Declaration =>
  importDeclaration(
    [importDefaultSpecifier(identifier)],
    stringLiteral(source)
  );

const rawStringImportDeclaration = (
  fragmentOrOperationName: string,
  source: string
): Declaration =>
  importDeclarationWithIdentifier(
    rawStringIdentifier(fragmentOrOperationName),
    source
  );

const stringImportDeclaration = (
  fragmentOrOperationName: string,
  source: string
): Declaration =>
  importDeclarationWithIdentifier(
    stringIdentifier(fragmentOrOperationName),
    source
  );

const joinedStringDeclaration = (
  fragmentOrOperationName: string,
  fragmentDependencies: string[]
): Declaration =>
  variableDeclaration("const", [
    variableDeclarator(
      stringIdentifier(fragmentOrOperationName),
      callExpression(
        memberExpression(
          arrayExpression([
            rawStringIdentifier(fragmentOrOperationName),
            ...fragmentDependencies.map(fragment => stringIdentifier(fragment))
          ]),
          identifier("join")
        ),
        [stringLiteral("\n\n")]
      )
    )
  ]);

const exportedJoinedStringDeclaration = (
  fragmentOrOperationName: string,
  fragmentDependencies: string[]
): Declaration =>
  exportDeclaration(
    joinedStringDeclaration(fragmentOrOperationName, fragmentDependencies)
  );

const exportedStringDeclaration = (
  fragmentOrOperationName: string
): Declaration =>
  exportDeclaration(
    variableDeclaration("const", [
      variableDeclarator(
        stringIdentifier(fragmentOrOperationName),
        rawStringIdentifier(fragmentOrOperationName)
      )
    ])
  );

export default (
  fragmentOrOperationName: string,
  filePath: string,
  outputPath: string,
  fragmentDependencies: string[],
  exportStringDeclaration: boolean = false
): Declaration[] =>
  compact(
    (fragmentDependencies.length > 0 || exportStringDeclaration
      ? rawStringImportDeclaration
      : stringImportDeclaration)(
      fragmentOrOperationName,
      relativePath(outputPath, filePath)
    ),
    fragmentDependencies.length > 0
      ? (exportStringDeclaration
          ? exportedJoinedStringDeclaration
          : joinedStringDeclaration)(
          fragmentOrOperationName,
          fragmentDependencies
        )
      : exportStringDeclaration &&
        exportedStringDeclaration(fragmentOrOperationName)
  );
