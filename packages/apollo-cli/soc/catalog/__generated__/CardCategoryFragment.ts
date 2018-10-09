import { MinimalSendableCardFragment } from "./MinimalSendableCardFragment";

import cardCategoryFragmentRawString from "../CardCategoryFragment.graphql";

export const cardCategoryFragmentString = cardCategoryFragmentRawString;

export type CardCategoryFragment = {
  __typename: "CardCategory";
  id: string;
  description: string;
  cards: MinimalSendableCardFragment[];
};
