import { Maybe } from "../../__generated__/globalTypes";

import {
  SendableCardFragment,
  isSendableCardFragment
} from "./SendableCardFragment";

import cardFragmentRawString from "../CardFragment.graphql";

export const cardFragmentString = cardFragmentRawString;

export type CardFragment = {
  __typename: "Card";
  id: string;
  sendableCard: Maybe<
    SendableCardFragment & {
      cardTemplate: Maybe<{
        backPanelLocation: number;
      }>;
      variations: (SendableCardFragment & {
        cardTemplate: Maybe<{
          backPanelLocation: number;
        }>;
      })[];
    }
  >;
};

export const isCardFragment = (fragment: any): fragment is CardFragment =>
  fragment &&
  fragment.__typename == "Card" &&
  typeof fragment.id == "string" &&
  (fragment.sendableCard == null ||
    ((isSendableCardFragment(fragment.sendableCard) as boolean) &&
      (fragment.sendableCard.cardTemplate == null ||
        (fragment.sendableCard.cardTemplate &&
          typeof fragment.sendableCard.cardTemplate.backPanelLocation ==
            "number")) &&
      Array.isArray(fragment.sendableCard.variations) &&
      fragment.sendableCard.variations
        .slice(0, 5)
        .reduce(
          (accum: any, next: any) =>
            accum &&
            (isSendableCardFragment(next) as boolean) &&
            (next.cardTemplate == null ||
              (next.cardTemplate &&
                typeof next.cardTemplate.backPanelLocation == "number")),
          true
        )));
