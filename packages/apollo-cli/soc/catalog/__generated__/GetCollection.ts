import { Maybe, Operation } from "../../__generated__/globalTypes";

import {
  CollectionFragment,
  collectionFragmentString
} from "./CollectionFragment";

import {
  DetailedSendableCardFragment,
  detailedSendableCardFragmentString
} from "./DetailedSendableCardFragment";

import { sendableCardDetailsFragmentString } from "./SendableCardDetailsFragment";

import { minimalSendableCardFragmentString } from "./MinimalSendableCardFragment";

import getCollectionRawString from "../GetCollection.graphql";

const getCollectionString = [
  getCollectionRawString,
  collectionFragmentString,
  detailedSendableCardFragmentString,
  sendableCardDetailsFragmentString,
  minimalSendableCardFragmentString
].join("\n\n");

export type GetCollectionData = {
  collection: Maybe<
    CollectionFragment & {
      description: string;
      reasonToSend: boolean;
      cards: DetailedSendableCardFragment[];
    }
  >;
};

export type GetCollectionVariables = {
  id: string;
};

export type GetCollection = Operation<
  GetCollectionData,
  GetCollectionVariables
>;

export const GetCollection = ({
  id
}: GetCollectionVariables): GetCollection => ({
  query: getCollectionString,
  variables: {
    id
  }
});
