import myCardFragmentRawString from "../MyCardFragment.graphql";

export const myCardFragmentString = myCardFragmentRawString;

export type MyCardFragment = {
  id: string;
  frontPreviewUrl: string;
  isHorizontal: boolean;
};

export const isMyCardFragment = (fragment: any): fragment is MyCardFragment =>
  fragment &&
  typeof fragment.id == "string" &&
  typeof fragment.frontPreviewUrl == "string" &&
  typeof fragment.isHorizontal == "boolean";
