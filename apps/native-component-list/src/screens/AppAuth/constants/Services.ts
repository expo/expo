import * as AppAuth from 'expo-app-auth';
import { Platform } from 'react-native';

const GUID = Platform.select({
  web: '629683148649-29390lifpv9kcp042bc23877isouoviq',
  ios: '629683148649-uvkfsi3pckps3lc4mbc2mi7pna8pqej5',
  android: '629683148649-jkqv4iha6ntt59bt44avatba7010j198',
});

// https://demo.identityserver.io/api/test

const Services: Record<
  string,
  {
    config: AppAuth.ExpoAuthorizationRequestJson;
    storageKey: string;
    issuer: string | AppAuth.ExpoAuthorizationServiceConfigurationJson;
  }
> = {
  identityserver: {
    // username/password: alice
    config: {
      // https://github.com/IdentityServer/IdentityServer4.Demo/blob/1f98c8012d7ff08c9a198660f3fe6ad8dafc6002/src/IdentityServer4Demo/Config.cs#L200
      clientId: 'native.code',
      redirectUri: Platform.select({
        web: 'https://localhost:19006/apis/AppAuth',
        default: 'io.identityserver.demo:/oauthredirect',
      }),
      scopes: ['openid', 'profile', 'email', 'offline_access'],
    },
    storageKey: 'identityserver',
    issuer: 'https://demo.identityserver.io',
  },
  spotify: {
    config: {
      clientId: 'cc809bf3e0a74f288c01fe14c3f3fbb3',
      redirectUri: Platform.select({
        web: 'https://localhost:19006/apis/AppAuth',
        default: `io.identityserver.demo:/oauthredirect`,
      }),
      scopes: ['user-read-email', 'playlist-modify-public', 'user-read-private'],
      extras: {
        client_secret: 'a45500e2a01d48b4939727846ff5ab24',
      },
    },
    storageKey: 'spotify',
    issuer: {
      authorizationEndpoint: 'https://accounts.spotify.com/authorize',
      tokenEndpoint: 'https://accounts.spotify.com/api/token',
    },
  },
  google: {
    config: {
      clientId: `${GUID}.apps.googleusercontent.com`,
      redirectUri: Platform.select({
        web: 'https://localhost:19006/apis/AppAuth',
        default: `com.googleusercontent.apps.${GUID}:/oauthredirect`,
      }),
      scopes: ['openid', 'profile'],
      /// In theory, the options should be able to map to these:
      /// https://docs.expo.io/versions/latest/sdk/google-sign-in/#types
      extras: {
        // login_hint: 'bacon@expo.io',
        // prompt: 'select_account',
        /// ui_locales doesn't seem to work as expected.
        // ui_locales: 'fr-CA fr en',
      },
    },
    storageKey: 'google',
    issuer: 'https://accounts.google.com',
  },
};

export default Services;
