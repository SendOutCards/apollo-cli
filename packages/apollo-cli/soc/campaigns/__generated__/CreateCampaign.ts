import {
  Maybe,
  CreateCampaignInput,
  Operation
} from "../../__generated__/globalTypes";

import createCampaignString from "../CreateCampaign.graphql";

export type CreateCampaign = {
  createCampaign: Maybe<{
    campaign: {
      id: string;
    };
  }>;
};

export const CreateCampaign = (
  campaign: CreateCampaignInput
): Operation<CreateCampaign> => ({
  query: createCampaignString,
  variables: {
    campaign: CreateCampaignInput(campaign)
  }
});
