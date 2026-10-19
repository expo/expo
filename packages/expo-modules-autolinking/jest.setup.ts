jest.mock('fs');
jest.mock('fs/promises');

jest.mock('./src/utils.ts', () => ({
  ...jest.requireActual('./src/utils.ts'),
  memoize: (x) => x,
}));
