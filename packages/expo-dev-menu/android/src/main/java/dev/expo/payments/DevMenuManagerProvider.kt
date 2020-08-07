package expo.modules.devmenu.modules

import com.facebook.react.bridge.BaseJavaModule
import com.facebook.react.module.annotations.ReactModule
import expo.modules.devmenu.managers.DevMenuManager
import expo.modules.devmenu.protocoles.DevMenuManagerProviderProtocol

private const val NAME = "DevMenuManagerProvider"

@ReactModule(name = NAME)
class DevMenuManagerProvider : BaseJavaModule(), DevMenuManagerProviderProtocol {
  override fun getName() = NAME

  override fun getDevMenuManager() = DevMenuManager
}
