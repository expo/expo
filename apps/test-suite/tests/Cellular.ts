import * as Cellular from 'expo-cellular';
import Constants from 'expo-constants';

export const name = 'Cellular (device-only)';

export async function test({ describe, it, expect, jasmine }) {
  const isNullOrString = (value: any) => {
    if (Constants.isDevice) {
      return typeof value === 'string';
    }
    return value === null || typeof value === 'string';
  };

  describe('Cellular', () => {
    describe('Cellular.allowsVoipAsync', () => {
      it('returns a boolean', async () => {
        const allowsVoip = await Cellular.allowsVoipAsync();
        if (Constants.isDevice) {
          expect(typeof allowsVoip === 'boolean').toBe(true);
        }
        expect(allowsVoip === null).toBe(true);
      });
    });
    describe('Cellular.getCarrierNameAsync()', () => {
      it('returns a string or null', async () => {
        const carrier = await Cellular.getCarrierNameAsync();

        expect(isNullOrString(carrier)).toBe(true);
      });
    });
    describe('Cellular.getIsoCountryCodeAsync()', () => {
      it('returns a string or null', async () => {
        const isoCountryCode = await Cellular.getIsoCountryCodeAsync();

        expect(isNullOrString(isoCountryCode)).toBe(true);
      });
    });
    describe('Cellular.getMobileCountryCodeAsync()', () => {
      it('returns a string or null', async () => {
        const mobileCountryCode = await Cellular.getMobileCountryCodeAsync();

        expect(isNullOrString(mobileCountryCode)).toBe(true);
      });
    });
    describe('Cellular.getMobileNetworkCodeAsync()', () => {
      it('returns a string or null', async () => {
        const mobileNetworkCode = await Cellular.getMobileNetworkCodeAsync();

        expect(isNullOrString(mobileNetworkCode)).toBe(true);
      });
    });

    describe('Cellular.getCellularGenerationAsync()', () => {
      it('returns an enum value of Cellular.Cellular Generation', async () => {
        let hasError = false;
        let cellularGeneration: Cellular.CellularGeneration | undefined;
        const CellularGenerationEnumValues = [0, 1, 2, 3, 4];

        try {
          cellularGeneration = await Cellular.getCellularGenerationAsync();
        } catch (e) {
          hasError = true;
          console.log(e);
        }

        expect(hasError).toBe(false);
        expect(cellularGeneration).toEqual(jasmine.any(Number));
        expect(CellularGenerationEnumValues.includes(cellularGeneration)).toBe(true);
      });
    });
  });

  // TODO: What about if airplane mode is on?
}
