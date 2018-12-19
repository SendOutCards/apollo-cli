import {
  MinimalSendableCardFragment,
  isMinimalSendableCardFragment
} from "./MinimalSendableCardFragment";

import {
  SendableCardDetailsFragment,
  isSendableCardDetailsFragment
} from "./SendableCardDetailsFragment";

import detailedSendableCardFragmentRawString from "../DetailedSendableCardFragment.graphql";

export const detailedSendableCardFragmentString = detailedSendableCardFragmentRawString;

export type DetailedSendableCardFragment = MinimalSendableCardFragment &
  SendableCardDetailsFragment;

export const isDetailedSendableCardFragment = (
  fragment: any
): fragment is DetailedSendableCardFragment =>
  (isMinimalSendableCardFragment(fragment) as boolean) &&
  (isSendableCardDetailsFragment(fragment) as boolean);
