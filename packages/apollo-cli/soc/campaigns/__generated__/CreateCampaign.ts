import {
  Maybe,
  CreateCampaignInput,
  Operation
} from "../../__generated__/globalTypes";

import createCampaignString from "../CreateCampaign.graphql";

export type CreateCampaignData = {
  createCampaign: Maybe<{
    campaign: {
      id: string;
    };
  }>;
};

export type CreateCampaignVariables = {
  campaign: CreateCampaignInput;
};

export type CreateCampaign = Operation<
  CreateCampaignData,
  CreateCampaignVariables
>;

export const CreateCampaign = ({
  campaign
}: CreateCampaignVariables): CreateCampaign => ({
  query: createCampaignString,
  variables: {
    campaign: CreateCampaignInput(campaign)
  }
});
