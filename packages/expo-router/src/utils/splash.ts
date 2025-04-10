import { requireOptionalNativeModule } from 'expo';

const SplashModule = requireOptionalNativeModule('ExpoSplashScreen');

let _initializedErrorHandler = false;

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

  if (!_initializedErrorHandler) {
    // Append error handling to ensure any uncaught exceptions result in the splash screen being hidden.
    // This prevents the splash screen from floating over error screens.
    if (ErrorUtils?.getGlobalHandler) {
      const originalHandler = ErrorUtils.getGlobalHandler();
      ErrorUtils.setGlobalHandler((error, isFatal) => {
        hide();
        originalHandler(error, isFatal);
      });
    }

    _initializedErrorHandler = true;
  }

  return SplashModule.internalPreventAutoHideAsync();
}

export async function _internal_maybeHideAsync() {
  if (!SplashModule) {
    return false;
  }

  return SplashModule.internalMaybeHideAsync();
}
