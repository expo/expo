package expo.interfaces.devmenu

import expo.interfaces.devmenu.DevMenuManagerInterface

@FunctionalInterface
interface DevMenuManagerProviderInterface {
  /**
   * Provides access to the object implementing the [DevMenuManagerInterface] interface.
   */
  fun getDevMenuManager(): DevMenuManagerInterface
}
