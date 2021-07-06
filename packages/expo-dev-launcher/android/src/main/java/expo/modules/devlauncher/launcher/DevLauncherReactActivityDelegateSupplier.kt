package expo.modules.devlauncher.launcher

import com.facebook.react.ReactActivityDelegate

@FunctionalInterface
interface DevLauncherReactActivityDelegateSupplier {
  fun get(): ReactActivityDelegate
}
