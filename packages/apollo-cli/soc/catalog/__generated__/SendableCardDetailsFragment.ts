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

export const isSendableCardDetailsFragment = (
  fragment: any
): fragment is SendableCardDetailsFragment =>
  fragment &&
  typeof fragment.description == "string" &&
  (fragment.insideRightImage == null ||
    (fragment.insideRightImage &&
      typeof fragment.insideRightImage.url == "string" &&
      typeof fragment.insideRightImage.smallThumb == "string")) &&
  typeof fragment.variationColor == "string" &&
  Array.isArray(fragment.variations) &&
  fragment.variations
    .slice(0, 5)
    .reduce(
      (accum: any, next: any) =>
        accum &&
        next &&
        typeof next.id == "string" &&
        next.frontImage &&
        typeof next.frontImage.id == "string" &&
        typeof next.frontImage.url == "string" &&
        typeof next.frontImage.smallThumb == "string" &&
        (next.insideRightImage == null ||
          (next.insideRightImage &&
            typeof next.insideRightImage.id == "string" &&
            typeof next.insideRightImage.url == "string" &&
            typeof next.insideRightImage.smallThumb == "string")) &&
        typeof next.variationColor == "string",
      true
    ) &&
  fragment.cost &&
  Array.isArray(fragment.cost.total) &&
  fragment.cost.total
    .slice(0, 5)
    .reduce(
      (accum: any, next: any) =>
        accum &&
        (next == null ||
          (next &&
            typeof next.asString == "string" &&
            typeof next.amount == "number")),
      true
    );
