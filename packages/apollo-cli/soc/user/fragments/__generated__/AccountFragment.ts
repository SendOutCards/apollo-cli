import { Maybe } from "../../../__generated__/globalTypes";

import { AddressFragment } from "./AddressFragment";

import accountFragmentRawString from "../AccountFragment.graphql";

export const accountFragmentString = accountFragmentRawString;

export type AccountFragment = {
  id: string;
  shippingAddress: Maybe<AddressFragment>;
};
