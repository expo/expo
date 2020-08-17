package expo.modules.devmenu.react

import android.app.Application
import android.os.Bundle
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import expo.modules.devmenu.interfaces.DevMenuDelegateInterface

/**
 * Basic [ReactNativeHost] which knows about expo-dev-menu and implements [DevMenuDelegateInterface].
 */
abstract class DevMenuAwareReactNativeHost(application: Application)
  : ReactNativeHost(application),
  DevMenuDelegateInterface {
  override fun appInfo(): Bundle? = null

  override fun reactInstanceManager(): ReactInstanceManager = super.getReactInstanceManager()
}
