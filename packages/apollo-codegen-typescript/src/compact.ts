export default <T>(...elements: (T | null | undefined | false)[]): T[] =>
  elements.reduce(
    (acc: T[], element: T | null | undefined | false) => (element ? acc.concat([element]) : acc),
    []
  );
