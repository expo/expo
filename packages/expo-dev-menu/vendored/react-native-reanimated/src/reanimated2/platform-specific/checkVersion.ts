// import { version as jsVersion } from '../../../package.json';
const jsVersion = "2.14.4"

/**
 * Checks that native and js versions of reanimated match.
 */
export function checkVersion(): void {
  const cppVersion = global._REANIMATED_VERSION_CPP;
  if (cppVersion === undefined) {
    console.error(
      `[Reanimated] Couldn't determine the version of the native part of Reanimated. Did you forget to re-build the app after upgrading react-native-reanimated? If you use Expo Go, you must use the exact version which is bundled into Expo SDK.`
    );
    return;
  }
  const ok = (() => {
    if (
      jsVersion.match(/^\d+\.\d+\.\d+$/) &&
      cppVersion.match(/^\d+\.\d+\.\d+$/)
    ) {
      // x.y.z, compare only major and minor, skip patch
      const [jsMajor, jsMinor] = jsVersion.split('.');
      const [cppMajor, cppMinor] = cppVersion.split('.');
      return jsMajor === cppMajor && jsMinor === cppMinor;
    } else {
      // alpha, beta or rc, compare everything
      return jsVersion === cppVersion;
    }
  })();
  if (!ok) {
    console.error(
      `[Reanimated] Mismatch between JavaScript part and native part of Reanimated (${jsVersion} vs. ${cppVersion}). Did you forget to re-build the app after upgrading react-native-reanimated? If you use Expo Go, you must downgrade to ${cppVersion} which is bundled into Expo SDK.`
    );
    // TODO: detect Expo managed workflow
  }
}
