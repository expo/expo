import * as Application from 'expo-application';
import { isDevice } from 'expo-device';
import { Platform } from 'react-native';

import ExponentTest from '../ExponentTest';

export const name = 'Application';
export async function test({ describe, it, expect, jasmine }) {
  describe(`Constants and methods common to Android and iOS`, () => {
    describe('constants tests', () => {
      it('gets Application.applicationName as a String', () => {
        const applicationName = Application.applicationName;
        expect(applicationName).toEqual(jasmine.any(String));
      });
      it('gets Application.applicationId as a String', () => {
        //e.g. iOS: 'host.exp.Exponent', Android: 'host.exp.exponent'
        const applicationId = Application.applicationId;
        expect(applicationId).toBeDefined();
        expect(applicationId).toEqual(jasmine.any(String));
      });
      it('gets nativeApplicationVersion as a String', () => {
        const nativeApplicationVersion = Application.nativeApplicationVersion;
        expect(nativeApplicationVersion).toBeDefined();
        expect(nativeApplicationVersion).toEqual(jasmine.any(String));
      });
      it('gets Application.nativeBuildVersion as a String', () => {
        //this will return a `number` on Android and a `string` on iOS
        const nativeBuildVersion = Application.nativeBuildVersion;
        expect(nativeBuildVersion).toBeDefined();
        expect(nativeBuildVersion).toEqual(jasmine.any(String));
      });
    });
    describe(`Application.getInstallationTimeAsync()`, () => {
      it(`returns a Date object`, async () => {
        const installationTime = await Application.getInstallationTimeAsync();
        expect(installationTime).toBeDefined();
        expect(installationTime).toEqual(jasmine.any(Date));
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

      it('Application.getIosApplicationReleaseTypeAsync() returns a number', async () => {
        const appReleaseType = await Application.getIosApplicationReleaseTypeAsync();
        expect(appReleaseType).toBeDefined();
        expect(appReleaseType).toEqual(jasmine.any(Number));
      });

      it('Application.getIosPushNotificationServiceEnvironmentAsync() returns a string', async () => {
        const apnsEnvironment = await Application.getIosPushNotificationServiceEnvironmentAsync();
        expect(apnsEnvironment).toBeDefined();
        if (isDevice) {
          expect(apnsEnvironment).toEqual(jasmine.any(String));
        } else {
          expect(apnsEnvironment).toBeNull();
        }
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
            installReferrer = await Application.getInstallReferrerAsync();
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
      it(`Application.getAndroidIdAsync() returns String`, async () => {
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

      if (ExponentTest && !ExponentTest.isInCI) {
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
      }
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
