// @flow

import ExpoGoogleSignIn from './ExpoGoogleSignIn';
import Identity from './Identity';
import Authentication from './Authentication';

class User extends Identity {
  auth: ?Authentication;
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
    if (!this.auth || !this.auth.accessToken) {
      throw new Error('GoogleSignIn: User.clearCache(): Invalid accessToken');
    }
    return ExpoGoogleSignIn.clearCacheAsync({ token: this.auth.accessToken });
  };

  getHeaders = (): Promise<{
    [string]: string,
  }> => {
    if (!this.auth.accessToken || this.auth.accessToken === '') {
      throw new Error('GoogleSignIn: User.getHeaders(): Invalid accessToken');
    }
    return {
      Authorization: `Bearer ${this.auth.accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
  };

  refreshAuth = async (): Promise<?Authentication> => {
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
      this.auth = new Authentication(response);
    } else {
      this.auth.idToken = response.idToken;
      this.auth.accessToken = response.accessToken;
    }
    return this.auth;
  };

  equals(other: ?any): boolean {
    if (!super.equals(other) || !(other instanceof User)) {
      return false;
    }

    return (
      this.auth.equals(other.auth) &&
      this.scopes === other.scopes &&
      this.hostedDomain === other.hostedDomain &&
      this.serverAuthCode === other.serverAuthCode
    );
  }

  toJSON(): object {
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

export default User;
