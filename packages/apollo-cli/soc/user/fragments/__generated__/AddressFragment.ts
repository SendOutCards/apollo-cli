import { Maybe } from "../../../__generated__/globalTypes";

import addressFragmentRawString from "../AddressFragment.graphql";

export const addressFragmentString = addressFragmentRawString;

export type AddressFragment = {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  postalCode: string;
  state: Maybe<string>;
  country: string;
};

export const isAddressFragment = (fragment: any): fragment is AddressFragment =>
  fragment &&
  typeof fragment.firstName == "string" &&
  typeof fragment.lastName == "string" &&
  typeof fragment.company == "string" &&
  typeof fragment.address1 == "string" &&
  typeof fragment.address2 == "string" &&
  typeof fragment.city == "string" &&
  typeof fragment.postalCode == "string" &&
  (fragment.state == null || typeof fragment.state == "string") &&
  typeof fragment.country == "string";
