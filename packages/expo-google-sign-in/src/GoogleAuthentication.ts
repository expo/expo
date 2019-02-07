import GoogleAuthData from './GoogleAuthData';

class GoogleAuthentication extends GoogleAuthData {
  clientId?: string;
  accessToken?: string;
  accessTokenExpirationDate?: number;
  refreshToken?: string;
  idToken?: string;
  idTokenExpirationDate?: number;

  constructor(options: any) {
    super(options);
    const {
      clientId,
      accessToken,
      accessTokenExpirationDate,
      refreshToken,
      idToken,
      idTokenExpirationDate,
    } = options;

    this.clientId = clientId;
    this.accessToken = accessToken;
    this.accessTokenExpirationDate = accessTokenExpirationDate;
    this.refreshToken = refreshToken;
    this.idToken = idToken;
    this.idTokenExpirationDate = idTokenExpirationDate;
  }

  equals(other: any): boolean {
    if (!super.equals(other) || !(other instanceof GoogleAuthentication)) {
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

  toJSON(): { [key: string]: any } {
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

export default GoogleAuthentication;
