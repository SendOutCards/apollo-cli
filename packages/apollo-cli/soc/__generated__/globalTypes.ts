export type Maybe<T> = T | null;
export type Optional<T> = Maybe<T> | undefined;
export type If<T, V> = { __typename: T } & V;
export type Operation<Data> = { query: string; variables?: any };
