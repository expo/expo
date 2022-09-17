import * as Cellular from 'expo-cellular';

export const name = 'Cellular';

export async function test({ describe, it, expect, jasmine }) {
  describe('Cellular', () => {
    describe('Cellular.allowsVoip', () => {
      it('returns a boolean', () => {
        const allowsVoip = Cellular.allowsVoip;

        expect(allowsVoip).toEqual(jasmine.any(Boolean));
      });
    });
    describe('Cellular.carrier', () => {
      it('is defined', () => {
        const carrier = Cellular.carrier;
        // nullable
        expect(carrier).toBeDefined();
      });
    });
    describe('Cellular.isoCountryCode', () => {
      it('is defined', () => {
        const isoCountryCode = Cellular.isoCountryCode;
        // nullable
        expect(isoCountryCode).toBeDefined();
      });
    });
    describe('Cellular.mobileCountryCode', () => {
      it('is defined', () => {
        const mobileCountryCode = Cellular.mobileCountryCode;
        // nullable
        expect(mobileCountryCode).toBeDefined();
      });
    });
    describe('Cellular.mobileNetworkCode', () => {
      it('is defined', () => {
        const mobileNetworkCode = Cellular.mobileNetworkCode;
        // nullable
        expect(mobileNetworkCode).toBeDefined();
      });
    });

    describe('Cellular.getCellularGenerationAsync()', () => {
      it('returns an enum value of Cellular.Cellular Generation', async () => {
        let hasError = false;
        let cellularGeneration;
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
