export const getRandomBytes = jest.fn((count) =>
  new Uint8Array(count).map((_) => Math.random() * 256)
);
