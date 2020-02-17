import {
  Maybe,
  CreateContactInput,
  Operation
} from "../../__generated__/globalTypes";

import createContactString from "../CreateContact.graphql";

export type CreateContactData = {
  createContact: Maybe<{
    contact: {
      id: string;
    };
  }>;
};

export type CreateContactVariables = {
  contact: CreateContactInput;
};

export type CreateContact = Operation<
  CreateContactData,
  CreateContactVariables
>;

export const CreateContact = ({
  contact
}: CreateContactVariables): CreateContact => ({
  query: createContactString,
  variables: {
    contact: CreateContactInput(contact)
  }
});
