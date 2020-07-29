import gql from 'graphql-tag';
import uuid from 'uuid';

jest.mock('../ApiV2HttpClient');
jest.mock('@react-native-community/async-storage', () => ({
  setItem: jest.fn(() => new Promise(resolve => resolve(null))),
  getItem: jest.fn(() => new Promise(resolve => resolve(null))),
  removeItem: jest.fn(() => new Promise(resolve => resolve(null))),
}));

describe('User Authentication Flow', () => {
  let ApiV2HttpClient;
  let AuthApi;
  let Store;
  let SessionActions;

  let originalFetch;

  beforeEach(async () => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();

    ApiV2HttpClient = require('../ApiV2HttpClient').default;
    AuthApi = require('../AuthApi');
    Store = require('../../redux/Store').default;
    SessionActions = require('../../redux/SessionActions').default;

    await Store.dispatch(SessionActions.signOut());
  });

  afterEach(() => {
    global.fetch = originalFetch;
    originalFetch = null;

    jest.restoreAllMocks();
    jest.resetModules();
  });

  it(`logs in and stores session tokens correctly`, async () => {
    const mockSignInResult = { sessionSecret: uuid.v4() };
    ApiV2HttpClient.mockImplementationOnce(() => {
      const AutomockedApiV2HttpClient = jest.genMockFromModule('../ApiV2HttpClient').default;
      const mockClient = new AutomockedApiV2HttpClient();
      mockClient.postAsync.mockReturnValueOnce(Promise.resolve(mockSignInResult));
      return mockClient;
    });

    // sign in
    const signInResult = await AuthApi.signInAsync('testuser', 't3stp4ssw0rd');
    expect(signInResult).toMatchObject(mockSignInResult);
    const { sessionSecret } = signInResult;

    // store session token
    await Store.dispatch(SessionActions.setSession({ sessionSecret }));

    // retrieve session token
    const state = Store.getState();
    const retrievedSession = state.session;

    // make sure the retrieved token is the same as the one we originally received
    expect(sessionSecret).toBeDefined();
    expect(sessionSecret).toBe(retrievedSession.sessionSecret);
  });

  it(`performs authenticated GraphQL queries`, async () => {
    const ApolloClient = require('../ApolloClient').default;
    const apolloLinkRequest = jest.spyOn(ApolloClient.link, 'request');

    const mockSignInResult = { sessionSecret: uuid.v4() };
    ApiV2HttpClient.mockImplementationOnce(() => {
      // since we use mockImplementationOnce, this constructor call is not recursive
      const mockClient = new ApiV2HttpClient();
      mockClient.postAsync.mockReturnValueOnce(Promise.resolve(mockSignInResult));
      return mockClient;
    });

    // sign in
    const signInResult = await AuthApi.signInAsync('testuser', 't3stp4ssw0rd');
    expect(signInResult).toMatchObject(mockSignInResult);
    const { sessionSecret } = signInResult;

    // store session token
    await Store.dispatch(SessionActions.setSession({ sessionSecret }));

    _setFakeHttpResponse(
      JSON.stringify({
        data: {
          app: {
            __typename: 'AppQuery',
            all: [
              { __typename: 'App', id: '2c28de10-a2cd-11e6-b8ce-59d1587e6774' },
              { __typename: 'App', id: '0d4823c0-37fb-11e7-9c45-89e7ab918dda' },
            ],
          },
        },
      })
    );

    try {
      await ApolloClient.query({
        query: gql`
          {
            app {
              all(limit: 2, filter: NEW, sort: TOP) {
                id
              }
            }
          }
        `,
        variables: null,
      });
    } finally {
      ApolloClient.resetStore();
    }

    // expect the query to be authenticated
    expect(apolloLinkRequest).toHaveBeenCalledTimes(1);
    const operation = apolloLinkRequest.mock.calls[0][0];
    expect(operation.getContext().headers).toMatchObject({
      'expo-session': mockSignInResult.sessionSecret,
    });
  });
});

function _setFakeHttpResponse(responseText) {
  global.fetch.mockReturnValue(
    Promise.resolve({
      async text() {
        return responseText;
      },
    })
  );
}
