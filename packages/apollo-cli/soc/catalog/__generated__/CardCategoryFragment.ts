import {
  MinimalSendableCardFragment,
  isMinimalSendableCardFragment
} from "./MinimalSendableCardFragment";

import cardCategoryFragmentRawString from "../CardCategoryFragment.graphql";

export const cardCategoryFragmentString = cardCategoryFragmentRawString;

export type CardCategoryFragment = {
  __typename: "CardCategory";
  id: string;
  description: string;
  cards: (MinimalSendableCardFragment)[];
};

export const isCardCategoryFragment = (
  fragment: any
): fragment is CardCategoryFragment =>
  fragment &&
  fragment.__typename == "CardCategory" &&
  typeof fragment.id == "string" &&
  typeof fragment.description == "string" &&
  Array.isArray(fragment.cards) &&
  fragment.cards
    .slice(0, 5)
    .reduce(
      (accum: any, next: any) =>
        accum && (isMinimalSendableCardFragment(next) as boolean),
      true
    );
