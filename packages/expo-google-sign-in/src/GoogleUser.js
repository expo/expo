// @flow
import { UnavailabilityError } from 'expo-errors';
import invariant from 'invariant';

import ExpoGoogleSignIn from './ExpoGoogleSignIn';
import GoogleAuthentication from './GoogleAuthentication';
import GoogleIdentity from './GoogleIdentity';

class GoogleUser extends GoogleIdentity {
  auth: ?GoogleAuthentication;
  scopes: Array<string>;
  hostedDomain: ?string;
  serverAuthCode: ?string;

  constructor(props) {
    super(props);
    const { auth, scopes, hostedDomain, serverAuthCode } = props;

    this.auth = auth;
    this.scopes = scopes;
    this.hostedDomain = hostedDomain;
    this.serverAuthCode = serverAuthCode;
  }

  clearCache = async () => {
    if (!ExpoGoogleSignIn.clearCacheAsync) {
      return;
    }
    invariant(
      this.auth && this.auth.accessToken,
      'GoogleSignIn: GoogleUser.clearCache(): Invalid accessToken'
    );
    return await ExpoGoogleSignIn.clearCacheAsync({ token: this.auth.accessToken });
  };

  getHeaders = (): Promise<{
    [string]: string,
  }> => {
    invariant(
      this.auth && this.auth.accessToken && this.auth.accessToken !== '',
      'GoogleSignIn: GoogleUser.getHeaders(): Invalid accessToken'
    );
    return {
      Authorization: `Bearer ${this.auth.accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  };

  refreshAuth = async (): Promise<?GoogleAuthentication> => {
    if (!ExpoGoogleSignIn.getTokensAsync) {
      throw new UnavailabilityError('GoogleSignIn', 'getTokensAsync');
    }
    const response: {
      idToken: ?string,
      accessToken: ?string,
      auth: ?{
        accessToken: ?string,
      },
    } = await ExpoGoogleSignIn.getTokensAsync(false);
    if (response.idToken == null) {
      response.idToken = this.auth.idToken;
    }
    if (!this.auth) {
      this.auth = new GoogleAuthentication(response);
    } else {
      this.auth.idToken = response.idToken;
      this.auth.accessToken = response.accessToken;
    }
    return this.auth;
  };

  equals(other: ?any): boolean {
    if (!super.equals(other) || !(other instanceof GoogleUser)) {
      return false;
    }

    return (
      this.auth.equals(other.auth) &&
      this.scopes === other.scopes &&
      this.hostedDomain === other.hostedDomain &&
      this.serverAuthCode === other.serverAuthCode
    );
  }

  toJSON(): { [string]: any } {
    let auth = this.auth;
    if (this.auth && this.auth.toJSON) {
      auth = this.auth.toJSON();
    }

    return {
      ...super.toJSON(),
      auth,
      scopes: this.scopes,
      hostedDomain: this.hostedDomain,
      serverAuthCode: this.serverAuthCode,
    };
  }
}

export default GoogleUser;
