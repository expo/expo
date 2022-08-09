module.exports = jest.fn(() => {
  const actualModule = jest.requireActual('@expo/spawn-async');

  return {
    __esModule: true,
    ...actualModule,
    // minimal implementation is needed here because the packager manager depends on the child property to exist.
    default: jest.fn((_command, _args, _options) => {
      const promise = new Promise((resolve, _reject) => resolve({}));
      // @ts-ignore: TypeScript isn't aware the Promise constructor argument runs synchronously
      promise.child = {};
      return promise;
    }),
  };
});
