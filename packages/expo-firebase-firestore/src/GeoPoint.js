/**
 * @flow
 * GeoPoint representation wrapper
 */
import invariant from 'invariant';

/**
 * @class GeoPoint
 */
export default class GeoPoint {
  _latitude: number;
  _longitude: number;

  constructor(latitude: number, longitude: number) {
    invariant(
      typeof latitude === 'number',
      `Storage: GeoPoint: Expected 'latitude' to be a number, instead found: ${typeof latitude}`
    );
    invariant(
      typeof longitude === 'number',
      `Storage: GeoPoint: Expected 'longitude' to be a number, instead found: ${typeof longitude}`
    );

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
