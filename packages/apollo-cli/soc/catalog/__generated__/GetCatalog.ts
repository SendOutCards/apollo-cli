import { Operation } from "../../__generated__/globalTypes";

import {
  ReasonToSendFragment,
  reasonToSendFragmentString
} from "./ReasonToSendFragment";

import {
  MinimalSendableCardFragment,
  minimalSendableCardFragmentString
} from "./MinimalSendableCardFragment";

import {
  CollectionFragment,
  collectionFragmentString
} from "./CollectionFragment";

import { MyCardFragment, myCardFragmentString } from "./MyCardFragment";

import {
  CardCategoryFragment,
  cardCategoryFragmentString
} from "./CardCategoryFragment";

import { detailedSendableCardFragmentString } from "./DetailedSendableCardFragment";

import { sendableCardDetailsFragmentString } from "./SendableCardDetailsFragment";

import getCatalogRawString from "../GetCatalog.graphql";

const getCatalogString = [
  getCatalogRawString,
  reasonToSendFragmentString,
  minimalSendableCardFragmentString,
  collectionFragmentString,
  myCardFragmentString,
  cardCategoryFragmentString,
  detailedSendableCardFragmentString,
  sendableCardDetailsFragmentString
].join("\n\n");

export type GetCatalog = {
  firstReasonToSend: ReasonToSendFragment[];
  reasonsToSend: ReasonToSendFragment[];
  favoritedCards: MinimalSendableCardFragment[];
  featuredCards: MinimalSendableCardFragment[];
  collections: CollectionFragment[];
  myCards: MyCardFragment[];
  legacyPicturePlusCards: MinimalSendableCardFragment[];
  cardCategories: CardCategoryFragment[];
};

export const GetCatalog = (): Operation<GetCatalog> => ({
  query: getCatalogString
});
