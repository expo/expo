import type { Coordinates } from './Position.types';

/**
 * An address paired with the coordinates it stands for. Fields the platform does not know for a
 * given place are `null`.
 * @example
 * ```ts
 * {
 *   coordinates: { latitude: 37.3317, longitude: -122.0301 },
 *   name: '1 Infinite Loop',
 *   formattedAddress: '1 Infinite Loop, Cupertino, CA 95014, United States',
 *   city: 'Cupertino',
 *   country: 'United States',
 *   isoCountryCode: 'US',
 * }
 * ```
 * @platform android
 * @platform ios
 */
export type Address = {
  /**
   * The latitude and longitude of the place, in degrees, for example,
   * `{ latitude: 37.3317, longitude: -122.0301 }`.
   */
  coordinates: Coordinates;
  /**
   * The name of the place, for example, `1 Infinite Loop`. Each platform reads this from its own
   * field, so it can be a building, a street, a postcode or an administrative area.
   */
  name: string | null;
  /**
   * The whole address on one line, for example,
   * `1 Infinite Loop, Cupertino, CA 95014, United States`.
   */
  formattedAddress: string | null;
  /**
   * The city name of the address, for example, `Cupertino`.
   *
   * This is `null` when the backend has no city for the place. That can happen even for a town you
   * would name, in which case the city is often still part of `formattedAddress`.
   */
  city: string | null;
  /**
   * The country name of the address, for example, `United States`.
   */
  country: string | null;
  /**
   * The ISO 3166-1 alpha-2 country code of the address, for example, `US`.
   */
  isoCountryCode: string | null;
};

/**
 * Options for [`geocode`](#geocodeaddressoptions).
 * @platform android
 * @platform ios
 */
export type GeocodeOptions = {
  /**
   * The language of the text fields in the result, as a BCP 47 tag such as `en-US`.
   * @default The device language.
   */
  locale?: string;
};

/**
 * Options for [`reverseGeocode`](#reversegeocodecoordinatesoptions).
 * @platform android
 * @platform ios
 */
export type ReverseGeocodeOptions = {
  /**
   * The language of the text fields in the result, as a BCP 47 tag such as `en-US`.
   * @default The device language.
   */
  locale?: string;
};
