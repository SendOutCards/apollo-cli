import { BasicGeneratedFile } from 'apollo-codegen-core/lib/utilities/CodeGenerator';

import { CompilerContext } from 'apollo-codegen-core/lib/compiler';

import Printer from './printer';

import {
  importDeclarationForFragment,
  typeAliasDeclarationForFragment,
  typeAliasDeclarationForOperation,
  variableDeclarationForOperation,
  typeAliasDeclarationForGraphQLInputObjectType,
  variableDeclarationForGraphQLInputObjectType,
  enumDeclarationForGraphQLEnumType,
  exportDeclaration
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

export function generateLocalSource(context: CompilerContext): IGeneratedFile[] {
  return [];
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
    printer.enqueue(importDeclarationForFragment(fragment));
    printer.enqueue(exportDeclaration(typeAliasDeclarationForFragment(fragment)));
  }
  for (const key in context.operations) {
    const operation = context.operations[key];
    printer.enqueue(exportDeclaration(typeAliasDeclarationForOperation(operation)));
    printer.enqueue(exportDeclaration(variableDeclarationForOperation(operation)));
  }
  const result = printer.print();
  return new TypescriptGeneratedFile('');
}
