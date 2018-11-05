/**
 * @flow
 * GeoPoint representation wrapper
 */

/**
 * @class GeoPoint
 */
export default class GeoPoint {
  _latitude: number;
  _longitude: number;

  constructor(latitude: number, longitude: number) {
    // TODO: Validation
    // validate.isNumber('latitude', latitude);
    // validate.isNumber('longitude', longitude);

    this._latitude = latitude;
    this._longitude = longitude;
  }

  get latitude(): number {
    return this._latitude;
  }

  get longitude(): number {
    return this._longitude;
  }
}
