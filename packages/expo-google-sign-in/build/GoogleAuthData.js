class GoogleAuthData {
    constructor(options) {
        this.equals = this.equals.bind(this);
        this.toJSON = this.toJSON.bind(this);
    }
    equals(other) {
        return other && other instanceof GoogleAuthData;
    }
    toJSON() {
        return {};
    }
}
export default GoogleAuthData;
//# sourceMappingURL=GoogleAuthData.js.map