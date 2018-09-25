import myCardFragmentRawString from "../MyCardFragment.graphql";

export const myCardFragmentString = myCardFragmentRawString;

export type MyCardFragment = {
  id: string;
  frontPreviewUrl: string;
  isHorizontal: boolean;
};
