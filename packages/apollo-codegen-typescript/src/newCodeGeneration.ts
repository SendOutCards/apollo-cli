import { BasicGeneratedFile } from 'apollo-codegen-core/lib/utilities/CodeGenerator';

import { CompilerContext } from 'apollo-codegen-core/lib/compiler';

import Printer from './printer';
import * as path from 'path';

import {
  importDeclarationForFragmentRawString,
  typeAliasDeclarationForFragment,
  typeAliasDeclarationForOperation,
  variableDeclarationForOperation,
  typeAliasDeclarationForGraphQLInputObjectType,
  variableDeclarationForGraphQLInputObjectType,
  enumDeclarationForGraphQLEnumType,
  exportDeclaration,
  importDeclarationForOperationRawString,
  globalImportDeclarationForFragmentDependencies
} from './types';
import { isInputObjectType, isEnumType } from 'graphql';

class TypescriptGeneratedFile implements BasicGeneratedFile {
  fileContents: string;

  constructor(fileContents: string) {
    this.fileContents = fileContents;
  }
  get output() {
    return this.fileContents;
  }
}

interface IGeneratedFileOptions {
  outputPath?: string;
  globalSourcePath?: string;
}

interface IGeneratedFile {
  sourcePath: string;
  fileName: string;
  content: (options?: IGeneratedFileOptions) => TypescriptGeneratedFile;
}

const globalImportPath = (outputPath: string, globalSourcePath: string) =>
  path.relative(
    path.dirname(outputPath),
    path.join(path.dirname(globalSourcePath), path.basename(globalSourcePath, '.ts'))
  );

export function generateLocalSource(context: CompilerContext): IGeneratedFile[] {
  return Object.values(context.fragments)
    .map(fragment => ({
      sourcePath: fragment.filePath,
      fileName: `${fragment.fragmentName}.ts`,
      content: (options?: IGeneratedFileOptions) => {
        return new TypescriptGeneratedFile(
          (options &&
            options.outputPath &&
            options.globalSourcePath &&
            `${fragment.filePath}\n${options.outputPath}\n${options.globalSourcePath}\n${globalImportPath(
              options.outputPath,
              options.globalSourcePath
            )}`) ||
            ''
        );
      }
    }))
    .concat(
      Object.values(context.operations).map(operation => ({
        sourcePath: operation.filePath,
        fileName: `${operation.operationName}.ts`,
        content: (options?: IGeneratedFileOptions) => {
          return new TypescriptGeneratedFile(
            (options &&
              options.outputPath &&
              options.globalSourcePath &&
              globalImportPath(options.outputPath, options.globalSourcePath)) ||
              ''
          );
        }
      }))
    );
}

export function generateGlobalSource(context: CompilerContext): TypescriptGeneratedFile {
  const printer = new Printer();
  context.typesUsed.forEach(type => {
    if (isEnumType(type)) {
      printer.enqueue(exportDeclaration(enumDeclarationForGraphQLEnumType(type)));
    } else if (isInputObjectType(type)) {
      printer.enqueue(exportDeclaration(typeAliasDeclarationForGraphQLInputObjectType(type)));
      printer.enqueue(exportDeclaration(variableDeclarationForGraphQLInputObjectType(type)));
    }
  });
  for (const key in context.fragments) {
    const fragment = context.fragments[key];
    printer.enqueue(importDeclarationForFragmentRawString(fragment));
    const globalImport = globalImportDeclarationForFragmentDependencies(fragment);
    if (globalImport) {
      printer.enqueue(globalImport);
    }
    printer.enqueue(exportDeclaration(typeAliasDeclarationForFragment(fragment)));
  }
  for (const key in context.operations) {
    const operation = context.operations[key];
    printer.enqueue(importDeclarationForOperationRawString(operation));
    printer.enqueue(exportDeclaration(typeAliasDeclarationForOperation(operation)));
    printer.enqueue(exportDeclaration(variableDeclarationForOperation(operation)));
  }
  const result = printer.print();
  return new TypescriptGeneratedFile(result);
}
