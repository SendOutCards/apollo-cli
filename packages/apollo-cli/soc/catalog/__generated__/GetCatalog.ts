import { Operation } from "../../__generated__/globalTypes";

import {
  ReasonToSendFragment,
  reasonToSendFragmentString
} from "./ReasonToSendFragment";

import {
  CollectionFragment,
  collectionFragmentString
} from "./CollectionFragment";

import { MyCardFragment, myCardFragmentString } from "./MyCardFragment";

import {
  CardCategoryFragment,
  cardCategoryFragmentString
} from "./CardCategoryFragment";

import { minimalSendableCardFragmentString } from "./MinimalSendableCardFragment";

import getCatalogRawString from "../GetCatalog.graphql";

const getCatalogString = [
  getCatalogRawString,
  reasonToSendFragmentString,
  collectionFragmentString,
  myCardFragmentString,
  cardCategoryFragmentString,
  minimalSendableCardFragmentString
].join("\n\n");

export type GetCatalog = {
  firstReasonToSend: ReasonToSendFragment[];
  reasonsToSend: ReasonToSendFragment[];
  collections: CollectionFragment[];
  myCards: MyCardFragment[];
  cardCategories: CardCategoryFragment[];
};

export const GetCatalog = (): Operation<GetCatalog> => ({
  query: getCatalogString
});
