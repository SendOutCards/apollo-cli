import { Operation } from "../../../__generated__/globalTypes";

import {
  AccountFragment,
  accountFragmentString
} from "../../fragments/__generated__/AccountFragment";

import { addressFragmentString } from "../../fragments/__generated__/AddressFragment";

import loadAccountRawString from "../LoadAccount.graphql";

const loadAccountString = [
  loadAccountRawString,
  accountFragmentString,
  addressFragmentString
].join("\n\n");

export type LoadAccount = {
  account: AccountFragment;
};

export const LoadAccount = (): Operation<LoadAccount> => ({
  query: loadAccountString
});
