// TODO: replace with jest.mocked when jest 27+ is upgraded to
export const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;
