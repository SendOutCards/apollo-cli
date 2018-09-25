import { Maybe } from "../../__generated__/globalTypes";

import collectionFragmentRawString from "../CollectionFragment.graphql";

export const collectionFragmentString = collectionFragmentRawString;

export type CollectionFragment = {
  __typename: string;
  id: string;
  title: string;
  backgroundStartColor: string;
  backgroundEndColor: string;
  backgroundImageUrl: Maybe<string>;
  textColor: string;
};
