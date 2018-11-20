import { Maybe } from "../../__generated__/globalTypes";

import collectionFragmentRawString from "../CollectionFragment.graphql";

export const collectionFragmentString = collectionFragmentRawString;

export type CollectionFragment = {
  __typename: "Collection";
  id: string;
  title: string;
  backgroundStartColor: string;
  backgroundEndColor: string;
  backgroundImageUrl: Maybe<string>;
  textColor: string;
};

export const isCollectionFragment = (
  fragment: any
): fragment is CollectionFragment =>
  fragment &&
  fragment.__typename == "Collection" &&
  typeof fragment.id == "string" &&
  typeof fragment.title == "string" &&
  typeof fragment.backgroundStartColor == "string" &&
  typeof fragment.backgroundEndColor == "string" &&
  (fragment.backgroundImageUrl == null ||
    typeof fragment.backgroundImageUrl == "string") &&
  typeof fragment.textColor == "string";
