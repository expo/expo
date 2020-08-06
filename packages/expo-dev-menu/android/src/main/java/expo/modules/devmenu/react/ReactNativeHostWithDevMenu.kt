package expo.modules.devmenu.react

import android.app.Application
import android.os.Bundle
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactNativeHost
import expo.modules.devmenu.protocoles.DevMenuDelegateProtocol

abstract class ReactNativeHostWithDevMenu(application: Application)
  : ReactNativeHost(application), DevMenuDelegateProtocol {

  override fun appInfo(): Bundle? = null

  override fun reactInstanceManager(): ReactInstanceManager = reactInstanceManager
}
