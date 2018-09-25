import { Maybe } from "../../__generated__/globalTypes";

import sendableCardDetailsFragmentRawString from "../SendableCardDetailsFragment.graphql";

export const sendableCardDetailsFragmentString = sendableCardDetailsFragmentRawString;

export type SendableCardDetailsFragment = {
  description: string;
  insideRightImage: Maybe<{
    url: string;
    smallThumb: string;
  }>;
  variationColor: string;
  variations: {
    id: string;
    frontImage: {
      id: string;
      url: string;
      smallThumb: string;
    };
    insideRightImage: Maybe<{
      id: string;
      url: string;
      smallThumb: string;
    }>;
    variationColor: string;
  }[];
  cost: {
    total: Maybe<{
      asString: string;
      amount: number;
    }>[];
  };
};
