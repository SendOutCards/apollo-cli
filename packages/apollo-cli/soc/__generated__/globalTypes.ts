export type Maybe<T> = T | null;
export type If<T, V> = { __typename: T } & V;
export type Operation<Data, Variables = undefined> = {
  query: string;
  variables: Variables;
};
export type ById<T> = { [id: string]: T | undefined };

export type CreateCampaignInput = {
  id?: Maybe<string>;
  name: string;
  order?: Maybe<string>;
  lines?: Maybe<LineInput[]>;
  returnAddress?: Maybe<AddressInput>;
};

export const CreateCampaignInput = ({
  id,
  name,
  order,
  lines,
  returnAddress
}: CreateCampaignInput): CreateCampaignInput => ({
  id,
  name,
  order,
  lines: lines && lines.map(x => LineInput(x)),
  returnAddress: returnAddress && AddressInput(returnAddress)
});

export type LineInput = {
  card?: Maybe<string>;
  giftVariation?: Maybe<string>;
  sendDelay?: Maybe<SendDelayInput>;
};

export const LineInput = ({
  card,
  giftVariation,
  sendDelay
}: LineInput = {}): LineInput => ({
  card,
  giftVariation,
  sendDelay: sendDelay && SendDelayInput(sendDelay)
});

export type SendDelayInput = {
  type?: Maybe<SendDelayType>;
  delayNumber?: Maybe<number>;
  delayType?: Maybe<SendDelayDelayType>;
  timeType?: Maybe<SendDelayTimeType>;
  specificDate?: Maybe<string>;
};

export const SendDelayInput = ({
  type,
  delayNumber,
  delayType,
  timeType,
  specificDate
}: SendDelayInput = {}): SendDelayInput => ({
  type,
  delayNumber,
  delayType,
  timeType,
  specificDate
});

export enum SendDelayType {
  IMM = "IMM",
  BIR = "BIR",
  ANN = "ANN",
  SPE = "SPE"
}

export enum SendDelayDelayType {
  DAY = "DAY",
  WEE = "WEE",
  MON = "MON"
}

export enum SendDelayTimeType {
  BEF = "BEF",
  AFT = "AFT"
}

export type AddressInput = {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export const AddressInput = ({
  firstName,
  lastName,
  company,
  address1,
  address2,
  city,
  state,
  postalCode,
  country
}: AddressInput): AddressInput => ({
  firstName,
  lastName,
  company,
  address1,
  address2,
  city,
  state,
  postalCode,
  country
});

export type CreateContactInput = {
  firstName?: Maybe<string>;
  lastName?: Maybe<string>;
  companyName?: Maybe<string>;
  address1?: Maybe<string>;
  address2?: Maybe<string>;
  city?: Maybe<string>;
  state?: Maybe<string>;
  postalCode?: Maybe<string>;
  country?: Maybe<string>;
  birthday?: Maybe<OptionalYearDateInput>;
  anniversary?: Maybe<OptionalYearDateInput>;
  homePhone?: Maybe<string>;
  cellNumber?: Maybe<string>;
  workPhone?: Maybe<string>;
  faxNumber?: Maybe<string>;
  emailAddress?: Maybe<string>;
  websites?: Maybe<string[]>;
  groupName?: Maybe<string>;
  groups?: Maybe<string[]>;
  spouse?: Maybe<string>;
  parent?: Maybe<string>;
  id?: Maybe<string>;
  spouseName?: Maybe<string>;
  spouseBirthday?: Maybe<OptionalYearDateInput>;
};

export const CreateContactInput = ({
  firstName,
  lastName,
  companyName,
  address1,
  address2,
  city,
  state,
  postalCode,
  country,
  birthday,
  anniversary,
  homePhone,
  cellNumber,
  workPhone,
  faxNumber,
  emailAddress,
  websites,
  groupName,
  groups,
  spouse,
  parent,
  id,
  spouseName,
  spouseBirthday
}: CreateContactInput = {}): CreateContactInput => ({
  firstName,
  lastName,
  companyName,
  address1,
  address2,
  city,
  state,
  postalCode,
  country,
  birthday: birthday && OptionalYearDateInput(birthday),
  anniversary: anniversary && OptionalYearDateInput(anniversary),
  homePhone,
  cellNumber,
  workPhone,
  faxNumber,
  emailAddress,
  websites,
  groupName,
  groups,
  spouse,
  parent,
  id,
  spouseName,
  spouseBirthday: spouseBirthday && OptionalYearDateInput(spouseBirthday)
});

export type OptionalYearDateInput = {
  day: number;
  month: number;
  year?: Maybe<number>;
};

export const OptionalYearDateInput = ({
  day,
  month,
  year
}: OptionalYearDateInput): OptionalYearDateInput => ({
  day,
  month,
  year
});

export type NormalizedCollection = {
  backgroundImageUrl: Maybe<string>;
  cards?: {
    __typename: "SendableCard";
    id: string;
  }[];
  __typename: "Collection";
  reasonToSend?: boolean;
  backgroundStartColor: string;
  textColor: string;
  backgroundEndColor: string;
  title: string;
  id: string;
  description?: string;
};

export type NormalizedSendableCard = {
  variations?: {
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
  __typename: "SendableCard";
  isFavorite: boolean;
  isPremium: boolean;
  cost?: {
    total: {
      asString: string;
      amount: number;
    }[];
  };
  isHorizontal: boolean;
  variationColor: string;
  frontImage: {
    url: string;
    smallThumb: string;
  };
  title: string;
  id: string;
  insideRightImage?: Maybe<{
    url: string;
    smallThumb: string;
  }>;
  description?: string;
};

export type NormalizedCardCategory = {
  __typename: "CardCategory";
  id: string;
  description: string;
  cards: {
    __typename: "SendableCard";
    id: string;
  }[];
};

export type NormalizedData = {
  Collection: ById<NormalizedCollection>;
  SendableCard: ById<NormalizedSendableCard>;
  CardCategory: ById<NormalizedCardCategory>;
};

export const NormalizedData = (): NormalizedData => ({
  Collection: {},
  SendableCard: {},
  CardCategory: {}
});
