import invariant from 'invariant';
/**
 * @class GeoPoint
 */
export default class GeoPoint {
    constructor(latitude, longitude) {
        invariant(typeof latitude === 'number', `Storage: GeoPoint: Expected 'latitude' to be a number, instead found: ${typeof latitude}`);
        invariant(typeof longitude === 'number', `Storage: GeoPoint: Expected 'longitude' to be a number, instead found: ${typeof longitude}`);
        this._latitude = latitude;
        this._longitude = longitude;
    }
    get latitude() {
        return this._latitude;
    }
    get longitude() {
        return this._longitude;
    }
}
//# sourceMappingURL=GeoPoint.js.map