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
