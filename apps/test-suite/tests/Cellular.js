import * as Cellular from 'expo-cellular';
import * as Network from 'expo-network';

export const name = 'Cellular';

export async function test({ describe, it, expect, jasmine }) {
  describe('Cellular.allowsVoip', () => {
    it('returns a boolean', () => {
      const allowsVoip = Cellular.allowsVoip;

      expect(allowsVoip).toEqual(jasmine.any(Boolean));
    });
  });
  describe('Cellular.carrier', () => {
    it('returns a String or null', () => {
      const carrier = Cellular.carrier;
      // nullable
      expect(carrier).toEqual(jasmine.any(String) || null);
    });
  });
  describe('Cellular.isoCountryCode', () => {
    it('returns a String or null', () => {
      const isoCountryCode = Cellular.isoCountryCode;
      // nullable
      expect(isoCountryCode).toEqual(jasmine.any(String) || null);
    });
  });
  describe('Cellular.mobileCountryCode', () => {
    it('returns a String or null', () => {
      const mobileCountryCode = Cellular.mobileCountryCode;
      // nullable
      expect(mobileCountryCode).toEqual(jasmine.any(String) || null);
    });
  });
  describe('Cellular.mobileNetworkCode', () => {
    it('returns a String or null', () => {
      const mobileNetworkCode = Cellular.mobileNetworkCode;
      // nullable
      expect(mobileNetworkCode).toEqual(jasmine.any(String) || null);
    });
  });

  describe('Cellular.getCellularGenerationAsync()', () => {
    it('returns an enum value of Cellular.Cellular Generation', async () => {
      let hasError = false;
      let cellularGeneration;
      const CellularGenerationEnumValues = [0, 1, 2, 3];

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

  // TODO: What about if airplane mode is on?
}
