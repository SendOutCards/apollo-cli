import minimalSendableCardFragmentRawString from "../MinimalSendableCardFragment.graphql";

export const minimalSendableCardFragmentString = minimalSendableCardFragmentRawString;

export type MinimalSendableCardFragment = {
  id: string;
  title: string;
  variationColor: string;
  isFavorite: boolean;
  isHorizontal: boolean;
  isPremium: boolean;
  frontImage: {
    url: string;
    smallThumb: string;
  };
};

export const isMinimalSendableCardFragment = (
  fragment: any
): fragment is MinimalSendableCardFragment =>
  fragment &&
  typeof fragment.id == "string" &&
  typeof fragment.title == "string" &&
  typeof fragment.variationColor == "string" &&
  typeof fragment.isFavorite == "boolean" &&
  typeof fragment.isHorizontal == "boolean" &&
  typeof fragment.isPremium == "boolean" &&
  fragment.frontImage &&
  typeof fragment.frontImage.url == "string" &&
  typeof fragment.frontImage.smallThumb == "string";
