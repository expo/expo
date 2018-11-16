// @flow

import AuthData from './AuthData';
class Identity extends AuthData {
  uid: string;
  email: string;
  displayName: ?string;
  photoURL: ?string;
  firstName: ?string;
  lastName: ?string;

  constructor(props) {
    super(props);
    const { uid, email, displayName, photoURL, firstName, lastName } = props;

    this.uid = uid;
    this.email = email;
    this.displayName = displayName;
    this.photoURL = photoURL;
    this.firstName = firstName;
    this.lastName = lastName;
  }

  equals(other: ?any): boolean {
    if (!super.equals(other) || !(other instanceof Identity)) {
      return false;
    }

    return (
      this.displayName === other.displayName &&
      this.photoURL === other.photoURL &&
      this.uid === other.uid &&
      this.email === other.email &&
      this.firstName === other.firstName &&
      this.lastName === other.lastName
    );
  }

  toJSON(): object {
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

export default Identity;
