import GoogleAuthData from './GoogleAuthData';
class GoogleIdentity extends GoogleAuthData {
    uid;
    email;
    displayName;
    photoURL;
    firstName;
    lastName;
    constructor(options) {
        super(options);
        const { uid, email, displayName, photoURL, firstName, lastName } = options;
        this.uid = uid;
        this.email = email;
        this.displayName = displayName;
        this.photoURL = photoURL;
        this.firstName = firstName;
        this.lastName = lastName;
    }
    equals(other) {
        if (!super.equals(other) || !(other instanceof GoogleIdentity)) {
            return false;
        }
        return (this.displayName === other.displayName &&
            this.photoURL === other.photoURL &&
            this.uid === other.uid &&
            this.email === other.email &&
            this.firstName === other.firstName &&
            this.lastName === other.lastName);
    }
    toJSON() {
        return {
            ...super.toJSON(),
            uid: this.uid,
            email: this.email,
            displayName: this.displayName,
            photoURL: this.photoURL,
            firstName: this.firstName,
            lastName: this.lastName,
        };
    }
}
export default GoogleIdentity;
//# sourceMappingURL=GoogleIdentity.js.map