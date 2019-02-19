class GoogleAuthData {
  constructor(options: any) {
    this.equals = this.equals.bind(this);
    this.toJSON = this.toJSON.bind(this);
  }

  equals(other: any): boolean {
    return other && other instanceof GoogleAuthData;
  }

  toJSON(): { [key: string]: any } {
    return {};
  }
}

export default GoogleAuthData;
