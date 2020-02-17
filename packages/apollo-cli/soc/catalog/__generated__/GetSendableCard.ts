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

export type GetSendableCardData = {
  sendableCard: Maybe<DetailedSendableCardFragment>;
};

export type GetSendableCardVariables = {
  id: string;
};

export type GetSendableCard = Operation<
  GetSendableCardData,
  GetSendableCardVariables
>;

export const GetSendableCard = ({
  id
}: GetSendableCardVariables): GetSendableCard => ({
  query: getSendableCardString,
  variables: {
    id
  }
});
