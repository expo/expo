import * as Application from 'expo-application';
import { Platform } from 'react-native';

export const name = 'Application';
export async function test({ describe, it, expect, jasmine }) {
  describe(`Constants and methods common to Android and iOS`, () => {
    describe('constants tests', () => {
      it('gets Application.applicationName as a String', () => {
        const applicationName = Application.applicationName;
        expect(applicationName).toEqual(jasmine.any(String));
      });
      it('gets Application.bundleId as a String', () => {
        //e.g. iOS: 'host.exp.Exponent', Android: 'host.exp.exponent'
        const bundleId = Application.bundleId;
        expect(bundleId).toBeDefined();
        expect(bundleId).toEqual(jasmine.any(String));
      });
      it('gets nativeApplicationVersion as a String', () => {
        const nativeApplicationVersion = Application.nativeApplicationVersion;
        expect(nativeApplicationVersion).toBeDefined();
        expect(nativeApplicationVersion).toEqual(jasmine.any(String));
      });
      it('gets Application.nativeBuildVersion as a Number on Android and String on iOS', () => {
        //this will return a `number` on Android and a `string` on iOS
        const nativeBuildVersion = Application.nativeBuildVersion;
        expect(nativeBuildVersion).toBeDefined();
        if (Platform.OS === 'ios') expect(nativeBuildVersion).toEqual(jasmine.any(String));
        else if (Platform.OS === 'android') expect(nativeBuildVersion).toEqual(jasmine.any(Number));
      });
    });
    describe(`Application.getFirstInstallTimeAsync()`, () => {
      it(`does returns a Date object`, async () => {
        let firstInstallTime = await Application.getFirstInstallTimeAsync();
        expect(firstInstallTime).toBeDefined();
        expect(firstInstallTime).toEqual(jasmine.any(Date));
      });
    });
  });

  if (Platform.OS === 'ios') {
    describe(`iOS device tests`, () => {
      it(`Application.getIosIdForVendorAsync() returns String`, async () => {
        let idfv;
        let error = null;
        try {
          idfv = await Application.getIosIdForVendorAsync();
        } catch (e) {
          error = e;
        }
        expect(idfv).toBeDefined();
        expect(idfv).toEqual(jasmine.any(String));
        expect(error).toBeNull();
      });

      describe(`doesn't get Android-only constants`, () => {
        it('Application.androidId is null', () => {
          expect(Application.androidId).toBeNull();
        });
      });

      describe(`doesn't call Android-only methods`, () => {
        it(`Application.getLastUpdateTimeAsync() doesn't get called`, async () => {
          let lastUpdateTime;
          let error = null;
          try {
            lastUpdateTime = await Application.getLastUpdateTimeAsync();
          } catch (e) {
            error = e;
          }
          expect(error).toBeDefined();
          expect(lastUpdateTime).toBeUndefined();
        });
        it(`Application.getInstallReferrerAsync() doesn't get called`, async () => {
          let installReferrer;
          let error = null;
          try {
            installReferrer = await Application.getinstallReferrerAsync();
          } catch (e) {
            error = e;
          }
          expect(error).toBeDefined();
          expect(installReferrer).toBeUndefined();
        });
      });
    });
  } else if (Platform.OS === 'android') {
    describe(`Android device tests`, () => {
      it(`gets Application.androidId as a String`, () => {
        let androidId = Application.androidId;

        expect(androidId).toBeDefined();
        expect(androidId).toEqual(jasmine.any(String));
      });

      it(`Application.getInstallReferrerAsync() returns String`, async () => {
        let error = null;
        let installReferrer;
        try {
          installReferrer = await Application.getInstallReferrerAsync();
        } catch (e) {
          error = e;
        }
        expect(installReferrer).toEqual(jasmine.any(String));
        expect(error).toBeNull();
      });
      it(`Application.getLastUpdateTimeAsync() returns String`, async () => {
        let error = null;
        let lastUpdateTime;
        try {
          lastUpdateTime = await Application.getLastUpdateTimeAsync();
        } catch (e) {
          error = e;
        }
        expect(lastUpdateTime).toEqual(jasmine.any(Date));
        expect(error).toBeNull();
      });
      describe(`doesn't call iOS-only methods`, () => {
        it(`Application.getIosIdForVendorAsync doesn't get called`, async () => {
          let idfv;
          let error = null;
          try {
            idfv = await Application.getIosIdForVendorAsync();
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