import accountFragmentRawString from "../user/fragments/AccountFragment.graphql";

export type AccountFragment = {
  id: string;
};

import loadAccountRawString from "../user/queries/LoadAccount.graphql";

export type LoadAccount = {
  account: AccountFragment;
};

export const LoadAccount = () => ({
  query: rawLoadAccount,
  variables: {}
});
