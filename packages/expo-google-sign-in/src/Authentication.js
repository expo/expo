// @flow

import AuthData from './AuthData';

class Authentication extends AuthData {
  clientId: ?string;
  accessToken: ?string;
  accessTokenExpirationDate: ?number;
  refreshToken: ?string;
  idToken: ?string;
  idTokenExpirationDate: ?number;

  constructor(props) {
    super(props);
    const {
      clientId,
      accessToken,
      accessTokenExpirationDate,
      refreshToken,
      idToken,
      idTokenExpirationDate,
    } = props;

    this.clientId = clientId;
    this.accessToken = accessToken;
    this.accessTokenExpirationDate = accessTokenExpirationDate;
    this.refreshToken = refreshToken;
    this.idToken = idToken;
    this.idTokenExpirationDate = idTokenExpirationDate;
  }

  equals(other: ?any): boolean {
    if (!super.equals(other) || !(other instanceof Authentication)) {
      return false;
    }

    return (
      this.clientId === other.clientId &&
      this.accessToken === other.accessToken &&
      this.accessTokenExpirationDate === other.accessTokenExpirationDate &&
      this.refreshToken === other.refreshToken &&
      this.idToken === other.idToken &&
      this.idTokenExpirationDate === other.idTokenExpirationDate
    );
  }

  toJSON(): object {
    return {
      ...super.toJSON(),
      clientId: this.clientId,
      accessToken: this.accessToken,
      accessTokenExpirationDate: this.accessTokenExpirationDate,
      refreshToken: this.refreshToken,
      idToken: this.idToken,
      idTokenExpirationDate: this.idTokenExpirationDate,
    };
  }
}

export default Authentication;
