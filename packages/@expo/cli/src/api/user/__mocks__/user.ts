export const getUserAsync = jest.fn(async () => ({}));
export const loginAsync = jest.fn();
export const browserLoginAsync = jest.fn();
export const ANONYMOUS_USERNAME = 'anonymous';

jest.mock('../user', () => ({
  loginAsync: jest.fn(),
  browserLoginAsync: jest.fn(),
}));
