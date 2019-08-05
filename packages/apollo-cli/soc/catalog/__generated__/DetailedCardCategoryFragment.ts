import {
  DetailedSendableCardFragment,
  isDetailedSendableCardFragment
} from "./DetailedSendableCardFragment";

import detailedCardCategoryFragmentRawString from "../DetailedCardCategoryFragment.graphql";

export const detailedCardCategoryFragmentString = detailedCardCategoryFragmentRawString;

export type DetailedCardCategoryFragment = {
  id: string;
  description: string;
  cards: (DetailedSendableCardFragment)[];
};

export const isDetailedCardCategoryFragment = (
  fragment: any
): fragment is DetailedCardCategoryFragment =>
  fragment &&
  typeof fragment.id == "string" &&
  typeof fragment.description == "string" &&
  Array.isArray(fragment.cards) &&
  fragment.cards
    .slice(0, 5)
    .reduce(
      (accum: any, next: any) =>
        accum && (isDetailedSendableCardFragment(next) as boolean),
      true
    );
