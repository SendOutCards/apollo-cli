import { CollectionFragment, isCollectionFragment } from "./CollectionFragment";

import {
  DetailedSendableCardFragment,
  isDetailedSendableCardFragment
} from "./DetailedSendableCardFragment";

import reasonToSendFragmentRawString from "../ReasonToSendFragment.graphql";

export const reasonToSendFragmentString = reasonToSendFragmentRawString;

export type ReasonToSendFragment = CollectionFragment & {
  description: string;
  cards: DetailedSendableCardFragment[];
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
      (accum: any, next: any) =>
        accum && (isDetailedSendableCardFragment(next) as boolean),
      true
    );
