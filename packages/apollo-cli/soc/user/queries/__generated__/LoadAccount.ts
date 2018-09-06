import { AccountFragment, accountFragmentString } from "../../fragments/__generated__/AccountFragment";

import loadAccountRawString from "../LoadAccount.graphql";

const loadAccountString = [loadAccountRawString, accountFragmentString].join("\n\n");

export type LoadAccount = {
  account: AccountFragment;
};

export const LoadAccount = () => ({
  query: loadAccountString,
  variables: {}
});
