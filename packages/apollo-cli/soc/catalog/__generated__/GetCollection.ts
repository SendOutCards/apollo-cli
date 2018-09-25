import { Maybe, Operation } from "../../__generated__/globalTypes";

import {
  CollectionFragment,
  collectionFragmentString
} from "./CollectionFragment";

import {
  MinimalSendableCardFragment,
  minimalSendableCardFragmentString
} from "./MinimalSendableCardFragment";

import getCollectionRawString from "../GetCollection.graphql";

const getCollectionString = [
  getCollectionRawString,
  collectionFragmentString,
  minimalSendableCardFragmentString
].join("\n\n");

export type GetCollection = {
  collection: Maybe<
    CollectionFragment & {
      description: string;
      reasonToSend: boolean;
      cards: MinimalSendableCardFragment[];
    }
  >;
};

export const GetCollection = (id: string): Operation<GetCollection> => ({
  query: getCollectionString,
  variables: {
    id
  }
});
