package expo.modules.developmentclient.launcher

import com.facebook.react.ReactActivityDelegate

@FunctionalInterface
interface ReactActivityDelegateSupplier {
  fun get(): ReactActivityDelegate
}
