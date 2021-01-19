export type Localization = {
  /**
   * Three character ISO 4217 currency code. Returns `null` on web.
   *
   * @example `USD`, `EUR`, `CNY`, null
   */
  currency: string | null;
  /**
   * Decimal separator used for formatting numbers.
   *
   * @example `,`, '.'
   */
  decimalSeparator: string;
  /**
   * Grouping separator used when formatting numbers larger than 1000.
   *
   * @example `.`, '', ','
   */
  groupingSeparator: string;
  /**
   * List of all the supported language ISO codes.
   */
  isoCurrencyCodes: string[];
  /**
   * Boolean value that indicates whether the system uses the metric system.
   */
  isMetric: boolean;
  /**
   * Returns if the system's language is written from Right-to-Left.
   * This can be used to build features like [bidirectional icons](https://material.io/design/usability/bidirectionality.html).
   *
   * Returns `false` in SSR environments.
   */
  isRTL: boolean;
  /**
   * Device locale (Unicode BCP 47 identifier), consisting of a language-code and optional script, region and variant codes.
   *
   * @example `en`, `en-US`, `zh-Hans`, `zh-Hans-CN`, `en-emodeng`
   */
  locale: string;
  /**
   * List of all the languages provided by the user settings.
   * These are returned in the order the user defines in their native settings.
   *
   * @example [`en`, `en-US`, `zh-Hans`, `zh-Hans-CN`, `en-emodeng`]
   */
  locales: string[];
  /**
   * Region code for your device which came from Region setting in Language & Region.
   * This value is always available on iOS, but might not be available on Android or web.
   *
   * @example `US`, `NZ`, null
   */
  region: string | null;
  /**
   * The current timezone in display format.
   * On Web timezone is calculated with Intl.DateTimeFormat().resolvedOptions().timeZone. For a better estimation you could use the moment-timezone package but it will add significant bloat to your website's bundle size.
   *
   * @example `America/Los_Angeles`
   */
  timezone: string;
};
