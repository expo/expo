package expo.modules.devmenu

import expo.interfaces.devmenu.DevMenuExtensionSettingsInterface

class DevMenuDefaultExtensionSettings(
  override val manager: DevMenuManager
) : DevMenuExtensionSettingsInterface {
  override fun wasRunOnDevelopmentBridge(): Boolean {
    if (manager.delegate?.supportsDevelopment() == false) {
      return false
    }

    return manager.getReactInstanceManager()?.devSupportManager != null
  }
}
