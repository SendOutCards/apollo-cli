export type Maybe<T> = T | null;
export type Optional<T> = Maybe<T> | undefined;
export type If<T, V> = { __typename: T } & V;
export type Operation<Data> = { query: string; variables?: any };
export type ById<T> = { [id: string]: T | undefined };

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
    total: Maybe<{
      asString: string;
      amount: number;
    }>[];
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
