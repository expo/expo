import uuid from 'uuid';
import HashIds from 'hashids';
import gql from 'graphql-tag';
import Auth0Api from '../Auth0Api';
import ApolloClient from '../ApolloClient';
import ExStore from '../../redux/Store';
import AuthTokenActions from '../../redux/AuthTokenActions';
import SessionActions from '../../redux/SessionActions';

jest.mock('react-native', () => {
  const ReactNative = require.requireActual('react-native');
  ReactNative.NativeModules.ExponentKernel = {
    sdkVersions: '12.0.0,11.0.0',
  };
  return ReactNative;
});
global.fetch = require('node-fetch');
global.alert = ()=>{}; // dont need user input to bypass alerts

const DeletionEndpoint = 'https://exp.host/--/api/v2/auth/deleteUser';

const _makeShortId = (salt: string, minLength: number = 10): string => {
  const hashIds = new HashIds(salt, minLength);
  return hashIds.encode(Date.now());
};
async function deleteUserAsync(idToken) {
  let response = await fetch(DeletionEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  return response.json();
}

describe('User Authentication Flow', () => {
  let testUsername;
  let testPassword;

  beforeAll(async () => {
    testUsername = `expo-app-${_makeShortId(uuid.v1())}`;
    testPassword = uuid.v1();

    // Register a new user that we can use for this test run
    const newUser = {
      firstName: 'quin',
      lastName: 'quin',
      username: testUsername,
      password: testPassword,
      email: `quin-${testUsername}@getexponent.com`,
    };

    await Auth0Api.signUpAsync(newUser);

    Store.dispatch(AuthTokenActions.clearAuthTokens());
    Store.dispatch(SessionActions.signOut());
  });

  afterAll(async () => {
    // sign in to obtain token, then delete user
    const signinResult = await Auth0Api.signInAsync(testUsername, testPassword);
    await deleteUserAsync(signinResult.id_token);
  });

  afterEach(async () => {
    // reset the spies
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  // login with Auth0, expect tokens to be stored
   it('login and stores auth tokens correctly', async () => {
    // sign in
    const signinResult = await Auth0Api.signInAsync(testUsername, testPassword);
    const { id_token, access_token, refresh_token, sessionSecret } = signinResult;

    // store auth and session tokens
    Store.dispatch(SessionActions.setSession({ sessionSecret: signinResult.sessionSecret }));
    Store.dispatch(
      AuthTokenActions.setAuthTokens({
        refreshToken: signinResult.refresh_token,
        accessToken: signinResult.access_token,
        idToken: signinResult.id_token,
      })
    );

    // retrieve auth and session tokens
    const state = Store.getState();
    const retrievedTokens = state.authTokens;
    const retrievedSession = state.session;

    // make sure the retrieved tokens are the same as the ones we originally received
    expect(id_token).toBe(retrievedTokens.idToken);
    expect(refresh_token).toBe(retrievedTokens.refreshToken);
    expect(access_token).toBe(retrievedTokens.accessToken);
    expect(sessionSecret).toBe(undefined);
    expect(retrievedSession.sessionSecret).toBe(undefined);
  });

  it('login and stores auth tokens and sessions correctly', async () => {
    // sign in
    const signinResult = await Auth0Api.signInAsync(testUsername, testPassword, {
      testSession: true,
    });
    const { id_token, access_token, refresh_token, sessionSecret } = signinResult;

    // store auth and session tokens
    Store.dispatch(SessionActions.setSession({ sessionSecret: signinResult.sessionSecret }));
    Store.dispatch(
      AuthTokenActions.setAuthTokens({
        refreshToken: signinResult.refresh_token,
        accessToken: signinResult.access_token,
        idToken: signinResult.id_token,
      })
    );

    // retrieve auth and session tokens
    const state = Store.getState();
    const retrievedTokens = state.authTokens;
    const retrievedSession = state.session;

    // make sure the retrieved tokens are the same as the ones we originally received
    expect(id_token).toBe(retrievedTokens.idToken);
    expect(refresh_token).toBe(retrievedTokens.refreshToken);
    expect(access_token).toBe(retrievedTokens.accessToken);
    expect(sessionSecret).toBe('TEST');
    expect(sessionSecret).toBe(retrievedSession.sessionSecret);
  }); 

  function createSpies() {
    return {
      _migrateAuth0ToSessionAsync: jest.spyOn(
        ApolloClient.networkInterface,
        '_migrateAuth0ToSessionAsync'
      ),
      _signOutAsync: jest.spyOn(ApolloClient.networkInterface, '_signOutAsync'),
      _refreshIdToken: jest.spyOn(ApolloClient.networkInterface, '_refreshIdTokenAsync'),
      connectivityAwareNetworkQuery: jest.spyOn(
        ApolloClient.networkInterface._networkInterface,
        'query'
      ),
    };
  }

  async function doGraphqlQuery() {
    try {
       await ApolloClient.query({
        query: gql`
          {
            app {
              all(limit: 5, filter: NEW, sort: TOP) {
                id
              }
            }
          }
        `,
        variables: null,
      });
    // reset client caches
    ApolloClient.resetStore();
    } catch (e) {}
  }
   it('does graphQL queries correctly, using sessions', async () => {
    let {
      _migrateAuth0ToSessionAsync,
      _signOutAsync,
      _refreshIdToken,
      connectivityAwareNetworkQuery,
    } = createSpies();

    // sign in, request for session secret to be returned
    const signinResult = await Auth0Api.signInAsync(testUsername, testPassword, {
      testSession: true,
    });

    // store auth and session tokens
    Store.dispatch(SessionActions.setSession({ sessionSecret: signinResult.sessionSecret }));
    Store.dispatch(
      AuthTokenActions.setAuthTokens({
        refreshToken: signinResult.refresh_token,
        accessToken: signinResult.access_token,
        idToken: signinResult.id_token,
      })
    );
    await doGraphqlQuery();

    // expect to do just a query
    expect(connectivityAwareNetworkQuery).toHaveBeenCalledTimes(1);
    expect(_migrateAuth0ToSessionAsync).toHaveBeenCalledTimes(0);
    expect(_signOutAsync).toHaveBeenCalledTimes(0);
    expect(_refreshIdToken).toHaveBeenCalledTimes(0);
  }); 

   it('does graphQL queries correctly, using id token', async () => {
    let {
      _migrateAuth0ToSessionAsync,
      _signOutAsync,
      _refreshIdToken,
      connectivityAwareNetworkQuery,
    } = createSpies();

    // sign in, request for only Auth0 tokens
    const signinResult = await Auth0Api.signInAsync(testUsername, testPassword, {
      testSession: false,
    });

    // store auth and session tokens
    Store.dispatch(SessionActions.setSession({ sessionSecret: signinResult.sessionSecret }));
    Store.dispatch(
      AuthTokenActions.setAuthTokens({
        refreshToken: signinResult.refresh_token,
        accessToken: signinResult.access_token,
        idToken: signinResult.id_token,
      })
    );
    await doGraphqlQuery();

    // expect to perform migration
    expect(connectivityAwareNetworkQuery).toHaveBeenCalledTimes(1);
    expect(_migrateAuth0ToSessionAsync).toHaveBeenCalledTimes(1);
    expect(_signOutAsync).toHaveBeenCalledTimes(0);
    expect(_refreshIdToken).toHaveBeenCalledTimes(0);
  }); 

  it('does graphQL queries correctly, using an expired id token with Auth0 in business', async () => {
    // sign in, request for only Auth0 tokens
    const signinResult = await Auth0Api.signInAsync(testUsername, testPassword, {
      testSession: false,
    });

    // store auth and session tokens
    Store.dispatch(SessionActions.setSession({ sessionSecret: signinResult.sessionSecret }));
    Store.dispatch(
      AuthTokenActions.setAuthTokens({
        refreshToken: signinResult.refresh_token,
        accessToken: signinResult.access_token,
        idToken: signinResult.id_token,
      })
    );

    let {
      _migrateAuth0ToSessionAsync,
      _signOutAsync,
      _refreshIdToken,
      connectivityAwareNetworkQuery,
    } = createSpies();
    // HACK: Auth0 is not responsive in the test :/
    _refreshIdToken.mockImplementation(() => {
      return { id_token: signinResult.id_token };
    });

    const spoofTokenValidity = (() => {
      // Use closures to return 'NOT VALID' on first call, then 'VALID' afterwards
      let isFirstCall = true;
      return () => {
        if (isFirstCall) {
          isFirstCall = false;
          return false;
        }
        return true;
      };
    })();
    ApolloClient.networkInterface._idTokenIsValid = jest.fn(spoofTokenValidity);

    // Hardcode today to be Jan 1, 2018
    global.Date.now = () => new Date(2018, 0, 1);

    await doGraphqlQuery();
    await doGraphqlQuery();

    // expect to refresh once, and perform migrations the second time
    expect(connectivityAwareNetworkQuery).toHaveBeenCalledTimes(2);
    expect(_migrateAuth0ToSessionAsync).toHaveBeenCalledTimes(1);
    expect(_signOutAsync).toHaveBeenCalledTimes(0);
    expect(_refreshIdToken).toHaveBeenCalledTimes(1);
  });

   it('signs out of graphQL queries correctly, using an expired id token with Auth0 gone forever', async () => {
    // sign in, request for only Auth0 tokens
    const signinResult = await Auth0Api.signInAsync(testUsername, testPassword, {
      testSession: false,
    });

    // store auth and session tokens
    Store.dispatch(SessionActions.setSession({ sessionSecret: signinResult.sessionSecret }));
    Store.dispatch(
      AuthTokenActions.setAuthTokens({
        refreshToken: signinResult.refresh_token,
        accessToken: signinResult.access_token,
        idToken: signinResult.id_token,
      })
    );

    let {
      _migrateAuth0ToSessionAsync,
      _signOutAsync,
      _refreshIdToken,
      connectivityAwareNetworkQuery,
    } = createSpies();

    const spoofTokenValidity = (() => {
      // Use closures to return 'NOT VALID' on first call, then 'VALID' afterwards
      let isFirstCall = true;
      return () => {
        if (isFirstCall) {
          isFirstCall = false;
          return false;
        }
        return true;
      };
    })();
    ApolloClient.networkInterface._idTokenIsValid = jest.fn(spoofTokenValidity);

    // Hardcode today to be Dec 1, 2018
    global.Date.now = () => new Date(2018, 11, 1);

    await doGraphqlQuery();

    // expect to have signed out
    expect(connectivityAwareNetworkQuery).toHaveBeenCalledTimes(0);
    expect(_migrateAuth0ToSessionAsync).toHaveBeenCalledTimes(0);
    expect(_signOutAsync).toHaveBeenCalledTimes(1);
    expect(_refreshIdToken).toHaveBeenCalledTimes(0);
  }); 
});
