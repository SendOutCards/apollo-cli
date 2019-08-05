import sendableCardFragmentRawString from "../SendableCardFragment.graphql";

export const sendableCardFragmentString = sendableCardFragmentRawString;

export type SendableCardFragment = {
  id: string;
};

export const isSendableCardFragment = (
  fragment: any
): fragment is SendableCardFragment =>
  fragment && typeof fragment.id == "string";
