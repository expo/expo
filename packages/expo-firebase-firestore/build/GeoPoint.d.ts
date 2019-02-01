/**
 * @class GeoPoint
 */
export default class GeoPoint {
    _latitude: number;
    _longitude: number;
    constructor(latitude: number, longitude: number);
    readonly latitude: number;
    readonly longitude: number;
}
