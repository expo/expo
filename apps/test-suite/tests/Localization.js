'use strict';

import { DangerZone } from 'expo';
const { Localization } = DangerZone;

export const name = 'Localization';

export function test(t) {
  t.describe(`Localization does something`, () => {
    t.it('Gets the current device country', async () => {
      const result = await Localization.getCurrentDeviceCountryAsync();
      t.expect(result).not.toBe(undefined);
    });
    t.it('Gets the current locale', async () => {
      const result = await Localization.getCurrentLocaleAsync();
      t.expect(result).not.toBe(undefined);
    });
    t.it('Gets the preferred locales', async () => {
      const result = await Localization.getPreferredLocalesAsync();
      t.expect(result).not.toBe(undefined);
    });
    t.it('Gets ISO currency codes', async () => {
      const result = await Localization.getISOCurrencyCodesAsync();
      t.expect(result).not.toBe(undefined);
    });
    t.it('Gets the current timzezone', async () => {
      const result = await Localization.getCurrentTimeZoneAsync();
      t.expect(result).not.toBe(undefined);
    });
  });
}
