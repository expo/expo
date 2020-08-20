package expo.modules.devmenu.modules

import com.facebook.react.bridge.BaseJavaModule
import com.facebook.react.module.annotations.ReactModule
import expo.modules.devmenu.DevMenuManager
import expo.interfaces.devmenu.DevMenuManagerInterface
import expo.interfaces.devmenu.DevMenuManagerProviderInterface

private const val NAME = "DevMenuManagerProvider"

@ReactModule(name = NAME)
class DevMenuManagerProvider : BaseJavaModule(), DevMenuManagerProviderInterface {
  override fun getName() = NAME

  override fun getDevMenuManager(): DevMenuManagerInterface = DevMenuManager
}
