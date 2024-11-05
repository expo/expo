import { requireOptionalNativeModule } from 'expo';

const SplashModule = requireOptionalNativeModule('ExpoSplashScreen');

export function hide() {
  if (!SplashModule) {
    return;
  }

  SplashModule.hide();
}

export async function hideAsync(): Promise<void> {
  hide();
}

export async function preventAutoHideAsync() {
  if (!SplashModule) {
    return;
  }

  return SplashModule.preventAutoHideAsync();
}

export async function _internal_preventAutoHideAsync(): Promise<boolean> {
  if (!SplashModule) {
    return false;
  }

  return SplashModule.preventAutoHideAsync();
}

export async function _internal_maybeHideAsync() {
  if (!SplashModule) {
    return false;
  }

  return SplashModule._internal_maybeHideAsync();
}
