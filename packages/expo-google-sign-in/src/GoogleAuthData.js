// @flow

class GoogleAuthData {
  constructor() {
    this.equals = this.equals.bind(this);
    this.toJSON = this.toJSON.bind(this);
  }

  equals(other: ?any): boolean {
    return other && other instanceof GoogleAuthData;
  }

  toJSON(): { [string]: any } {
    return {};
  }
}

export default GoogleAuthData;
