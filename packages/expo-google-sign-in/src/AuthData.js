// @flow

class AuthData {
  constructor() {
    this.equals = this.equals.bind(this);
    this.toJSON = this.toJSON.bind(this);
  }

  equals(other: ?any): boolean {
    if (!other || !(other instanceof AuthData)) return false;
    return true;
  }

  toJSON(): object {
    return {};
  }
}

export default AuthData;
