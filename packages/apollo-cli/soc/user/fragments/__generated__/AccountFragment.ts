import { Maybe } from "../../../__generated__/globalTypes";

import { AddressFragment, addressFragmentString } from "./AddressFragment";

import accountFragmentRawString from "../AccountFragment.graphql";

export const accountFragmentString = [accountFragmentRawString, addressFragmentString].join("\n\n");

export type AccountFragment = {
  id: string;
  shippingAddress: Maybe<AddressFragment>;
};
