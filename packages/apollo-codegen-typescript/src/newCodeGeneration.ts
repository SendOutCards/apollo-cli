import { BasicGeneratedFile } from "apollo-codegen-core/lib/utilities/CodeGenerator";

import { CompilerContext } from "apollo-codegen-core/lib/compiler";

import Printer from "./printer";

import {
  typeAliasDeclarationForGraphQLInputObjectType,
  enumDeclarationForGraphQLEnumType,
  exportDeclaration
} from "./types";
import { constructorDeclarationForGraphQLInputObjectType } from "./constructors";
import { isEnumType, isInputObjectType } from "graphql";
import { operationFile } from "./operationFile";
import { fragmentFile } from "./fragmentFile";

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

export function generateLocalSource(
  context: CompilerContext
): IGeneratedFile[] {
  return Object.values(context.fragments)
    .map(fragment => ({
      sourcePath: fragment.filePath,
      fileName: `${fragment.fragmentName}.ts`,
      content: (options?: IGeneratedFileOptions) => {
        const printer = new Printer();
        if (options && options.outputPath && options.globalSourcePath) {
          fragmentFile(
            fragment,
            options.outputPath,
            options.globalSourcePath,
            context
          ).forEach(printable => printer.enqueue(printable));
        }
        const result = printer.print();
        return new TypescriptGeneratedFile(result);
      }
    }))
    .concat(
      Object.values(context.operations).map(operation => ({
        sourcePath: operation.filePath,
        fileName: `${operation.operationName}.ts`,
        content: (options?: IGeneratedFileOptions) => {
          const printer = new Printer();
          if (options && options.outputPath && options.globalSourcePath) {
            operationFile(
              operation,
              options.outputPath,
              options.globalSourcePath,
              context
            ).forEach(printable => printer.enqueue(printable));
          }
          const result = printer.print();
          return new TypescriptGeneratedFile(result);
        }
      }))
    );
}

const globalTypes = `export type Maybe<T> = T | null;
export type Optional<T> = Maybe<T> | undefined;
export type If<T, V> = { __typename: T } & V;
export type Operation<Data> = { query: string; variables?: any };`;

export function generateGlobalSource(
  context: CompilerContext
): TypescriptGeneratedFile {
  // Object.values(context.schema.getTypeMap())
  //   .filter(type => isCompositeType(type))
  //   .map(type => type as GraphQLCompositeType)
  //   .forEach(type => {
  //     console.log(type);
  //   });
  const printer = new Printer();
  printer.enqueue(globalTypes);
  context.typesUsed.forEach(type => {
    if (isEnumType(type)) {
      printer.enqueue(
        exportDeclaration(enumDeclarationForGraphQLEnumType(type))
      );
    } else if (isInputObjectType(type)) {
      printer.enqueue(
        exportDeclaration(typeAliasDeclarationForGraphQLInputObjectType(type))
      );
      printer.enqueue(
        exportDeclaration(constructorDeclarationForGraphQLInputObjectType(type))
      );
    }
  });
  const result = printer.print();
  return new TypescriptGeneratedFile(result);
}
