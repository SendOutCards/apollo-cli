import { Maybe, Operation } from "../../__generated__/globalTypes";

import {
  DetailedSendableCardFragment,
  detailedSendableCardFragmentString
} from "./DetailedSendableCardFragment";

import { sendableCardDetailsFragmentString } from "./SendableCardDetailsFragment";

import { minimalSendableCardFragmentString } from "./MinimalSendableCardFragment";

import getSendableCardRawString from "../GetSendableCard.graphql";

const getSendableCardString = [
  getSendableCardRawString,
  detailedSendableCardFragmentString,
  sendableCardDetailsFragmentString,
  minimalSendableCardFragmentString
].join("\n\n");

export type GetSendableCard = {
  sendableCard: Maybe<DetailedSendableCardFragment>;
};

export const GetSendableCard = (id: string): Operation<GetSendableCard> => ({
  query: getSendableCardString,
  variables: {
    id
  }
});
