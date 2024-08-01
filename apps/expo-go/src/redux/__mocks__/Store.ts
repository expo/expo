export default {
  getState: jest.fn(() => ({
    history: { history: [] },
    session: { sessionSecret: null },
    settings: { preferredAppearance: undefined },
  })),
  dispatch: jest.fn((action) => action),
  subscribe: jest.fn(() => jest.fn()),
  replaceReducer: jest.fn(),
};
