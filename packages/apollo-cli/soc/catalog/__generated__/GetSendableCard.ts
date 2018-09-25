import { Maybe, Operation } from "../../__generated__/globalTypes";

import {
  MinimalSendableCardFragment,
  minimalSendableCardFragmentString
} from "./MinimalSendableCardFragment";

import {
  SendableCardDetailsFragment,
  sendableCardDetailsFragmentString
} from "./SendableCardDetailsFragment";

import getSendableCardRawString from "../GetSendableCard.graphql";

const getSendableCardString = [
  getSendableCardRawString,
  minimalSendableCardFragmentString,
  sendableCardDetailsFragmentString
].join("\n\n");

export type GetSendableCard = {
  sendableCard: Maybe<
    MinimalSendableCardFragment & SendableCardDetailsFragment
  >;
};

export const GetSendableCard = (id: string): Operation<GetSendableCard> => ({
  query: getSendableCardString,
  variables: {
    id
  }
});
