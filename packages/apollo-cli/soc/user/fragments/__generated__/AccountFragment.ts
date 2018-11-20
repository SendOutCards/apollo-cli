import { Maybe } from "../../../__generated__/globalTypes";

import { AddressFragment, isAddressFragment } from "./AddressFragment";

import accountFragmentRawString from "../AccountFragment.graphql";

export const accountFragmentString = accountFragmentRawString;

export type AccountFragment = {
  id: string;
  shippingAddress: Maybe<AddressFragment>;
};

export const isAccountFragment = (fragment: any): fragment is AccountFragment =>
  fragment &&
  typeof fragment.id == "string" &&
  (fragment.shippingAddress == null ||
    (isAddressFragment(fragment.shippingAddress) as boolean));
