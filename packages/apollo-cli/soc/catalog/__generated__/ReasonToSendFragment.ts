import { CollectionFragment, isCollectionFragment } from "./CollectionFragment";

import {
  MinimalSendableCardFragment,
  isMinimalSendableCardFragment
} from "./MinimalSendableCardFragment";

import reasonToSendFragmentRawString from "../ReasonToSendFragment.graphql";

export const reasonToSendFragmentString = reasonToSendFragmentRawString;

export type ReasonToSendFragment = CollectionFragment & {
  description: string;
  cards: MinimalSendableCardFragment[];
};

export const isReasonToSendFragment = (
  fragment: any
): fragment is ReasonToSendFragment =>
  (isCollectionFragment(fragment) as boolean) &&
  typeof fragment.description == "string" &&
  Array.isArray(fragment.cards) &&
  fragment.cards
    .slice(0, 5)
    .reduce(
      (accum, next) =>
        accum && (isMinimalSendableCardFragment(next) as boolean),
      true
    );
