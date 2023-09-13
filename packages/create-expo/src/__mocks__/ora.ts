const ora = jest.fn(() => {
  return {
    start: jest.fn(() => {
      return { stop: jest.fn(), succeed: jest.fn(), fail: jest.fn() };
    }),
    stop: jest.fn(),
    stopAndPersist: jest.fn(),
    succeed: jest.fn(),
    fail: jest.fn(),
  };
});

module.exports = ora;
