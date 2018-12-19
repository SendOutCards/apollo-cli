import { Operation } from "./__generated__/globalTypes";
import { LoadAccount } from "./user/queries/__generated__/LoadAccount";
import { isError } from "util";
import { CardCategoryFragment } from "./catalog/__generated__/CardCategoryFragment";
import { DetailedCardCategoryFragment } from "./catalog/__generated__/DetailedCardCategoryFragment";

type Result<T> = T | Error;
type Action = "Hello";
type Task<T> = {
  operation: Operation<T>;
  completion: (result: Result<T>) => Action;
};

const Task = <T>(
  operation: Operation<T>,
  completion: (result: Result<T>) => Action
): Task<T> => ({
  operation,
  completion
});

const loadAccountTask = Task(
  LoadAccount(),
  result =>
    isError(result)
      ? "Hello"
      : result.account.id == "Hello"
        ? result.account.id
        : "Hello"
);

type Something =
  | DetailedCardCategoryFragment
  | CardCategoryFragment
  | (DetailedCardCategoryFragment & CardCategoryFragment);

const something = {} as Something;
