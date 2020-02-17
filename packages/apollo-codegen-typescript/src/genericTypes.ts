import { Set } from "immutable";
import {
  identifier,
  TSUnionType,
  TSType,
  TSTypeReference,
  TSTypeParameterInstantiation,
  TSLiteralType,
  stringLiteral
} from "@babel/types";

const isNotUndefined = <T>(value: T | undefined): value is T =>
  value != undefined;

const GenericType = (name: string, ...types: (TSType | undefined)[]): TSType =>
  TSTypeReference(identifier(name), TSTypeParameterInstantiation(
    types.filter(isNotUndefined)
  ) as any);

export const MaybeType = (type: TSType): TSType => GenericType("Maybe", type);

export const PartialType = (type: TSType): TSType =>
  GenericType("Partial", type);

export const IfType = (possibleTypes: Set<string>, type: TSType): TSType =>
  GenericType(
    "If",
    TSUnionType(
      possibleTypes
        .sort()
        .toArray()
        .map(type => TSLiteralType(stringLiteral(type)))
    ),
    type
  );

export const OperationType = (
  dataType: TSType,
  variablesType: TSType | undefined
): TSType => GenericType("Operation", dataType, variablesType);

export const ByIdType = (type: TSType): TSType => GenericType("ById", type);
