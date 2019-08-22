import {
  Maybe,
  CreateContactInput,
  Operation
} from "../../__generated__/globalTypes";

import createContactString from "../CreateContact.graphql";

export type CreateContact = {
  createContact: Maybe<{
    contact: {
      id: string;
    };
  }>;
};

export const CreateContact = (
  contact: CreateContactInput
): Operation<CreateContact> => ({
  query: createContactString,
  variables: {
    contact: CreateContactInput(contact)
  }
});
