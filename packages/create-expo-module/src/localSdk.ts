import { UserError } from './utils/errors';

const MIN_SUPPORTED_LOCAL_SDK = 55;

export function assertSupportedLocalSdk(sdkVersion: number | null): void {
  if (sdkVersion != null && sdkVersion < MIN_SUPPORTED_LOCAL_SDK) {
    throw new UserError(
      `This version of create-expo-module does not support local modules in Expo SDK ${sdkVersion}.` +
        '\n\nTo create a local module for this SDK, use the SDK 55 CLI:\n\n' +
        '  npx create-expo-module@sdk-55 --local\n'
    );
  }
}
