import * as ExpoTrackingTransparency from 'expo-tracking-transparency';
import { Platform } from 'react-native';

export const name = 'TrackingTransparency';
export async function test({ describe, it, expect, jasmine }) {
  if (Platform.OS === 'ios') {
    describe(`iOS device tests`, () => {
      it(`ExpoTrackingTransparency.getIosIdForVendor() returns String`, () => {
        let idfv;
        let error = null;
        try {
          idfv = ExpoTrackingTransparency.getIosIdForVendor();
        } catch (e) {
          error = e;
        }
        expect(idfv).toBeDefined();
        expect(idfv).toEqual(jasmine.any(String));
        expect(error).toBeNull();
      });

      describe(`doesn't call Android-only methods`, () => {
        it(`ExpoTrackingTransparency.getAndroidId() doesn't get called`, () => {
          let androidId;
          let error = null;
          try {
            androidId = ExpoTrackingTransparency.getAndroidId();
          } catch (e) {
            error = e;
          }
          expect(error).toBeDefined();
          expect(androidId).toBeUndefined();
        });
      });
    });
  } else if (Platform.OS === 'android') {
    describe(`Android device tests`, () => {
      it(`ExpoTrackingTransparency.getAndroidId() returns String`, () => {
        let error = null;
        let androidId;
        try {
          androidId = ExpoTrackingTransparency.getAndroidId();
        } catch (e) {
          error = e;
        }
        expect(androidId).toEqual(jasmine.any(String));
        expect(error).toBeNull();
      });

      describe(`doesn't call iOS-only methods`, () => {
        it(`ExpoTrackingTransparency.getIosIdForVendor doesn't get called`, () => {
          let idfv;
          let error = null;
          try {
            idfv = ExpoTrackingTransparency.getIosIdForVendor();
          } catch (e) {
            error = e;
          }
          expect(error).toBeDefined();
          expect(idfv).toBeUndefined();
        });
      });
    });
  }
}
