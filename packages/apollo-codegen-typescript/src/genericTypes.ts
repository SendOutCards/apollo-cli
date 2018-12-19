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

const GenericType = (name: string, ...types: TSType[]): TSType =>
  TSTypeReference(identifier(name), TSTypeParameterInstantiation(types) as any);

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

export const OptionalType = (type: TSType): TSType =>
  GenericType("Optional", type);

export const OperationType = (type: TSType): TSType =>
  GenericType("Operation", type);

export const ByIdType = (type: TSType): TSType => GenericType("ById", type);
