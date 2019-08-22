export type Maybe<T> = T | null;
export type Optional<T> = Maybe<T> | undefined;
export type If<T, V> = { __typename: T } & V;
export type Operation<Data> = { query: string; variables?: any };
export type ById<T> = { [id: string]: T | undefined };

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
}: CreateContactInput): CreateContactInput => ({
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
