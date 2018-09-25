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
