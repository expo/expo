export default {
  getSession: jest.fn(() => ({
    sessionSecret: 'test-session-secret',
  })),
  getAccessToken: jest.fn(() => 'test-access-token'),
};
