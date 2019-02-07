import GoogleAuthData from './GoogleAuthData';
class GoogleAuthentication extends GoogleAuthData {
    constructor(options) {
        super(options);
        const { clientId, accessToken, accessTokenExpirationDate, refreshToken, idToken, idTokenExpirationDate, } = options;
        this.clientId = clientId;
        this.accessToken = accessToken;
        this.accessTokenExpirationDate = accessTokenExpirationDate;
        this.refreshToken = refreshToken;
        this.idToken = idToken;
        this.idTokenExpirationDate = idTokenExpirationDate;
    }
    equals(other) {
        if (!super.equals(other) || !(other instanceof GoogleAuthentication)) {
            return false;
        }
        return (this.clientId === other.clientId &&
            this.accessToken === other.accessToken &&
            this.accessTokenExpirationDate === other.accessTokenExpirationDate &&
            this.refreshToken === other.refreshToken &&
            this.idToken === other.idToken &&
            this.idTokenExpirationDate === other.idTokenExpirationDate);
    }
    toJSON() {
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
//# sourceMappingURL=GoogleAuthentication.js.map