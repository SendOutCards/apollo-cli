import { CollectionFragment } from "./CollectionFragment";

import { MinimalSendableCardFragment } from "./MinimalSendableCardFragment";

import reasonToSendFragmentRawString from "../ReasonToSendFragment.graphql";

export const reasonToSendFragmentString = reasonToSendFragmentRawString;

export type ReasonToSendFragment = CollectionFragment & {
  description: string;
  cards: MinimalSendableCardFragment[];
};
