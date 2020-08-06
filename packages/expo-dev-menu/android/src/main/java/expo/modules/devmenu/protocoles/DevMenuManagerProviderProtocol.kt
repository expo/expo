package expo.modules.devmenu.protocoles

import expo.modules.devmenu.managers.DevMenuManager

@FunctionalInterface
interface DevMenuManagerProviderProtocol {
  fun getDevMenuManager(): DevMenuManager
}
