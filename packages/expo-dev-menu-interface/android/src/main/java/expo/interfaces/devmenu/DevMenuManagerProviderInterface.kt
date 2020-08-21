package expo.interfaces.devmenu

@FunctionalInterface
interface DevMenuManagerProviderInterface {
  /**
   * Provides access to the object implementing the [DevMenuManagerInterface] interface.
   */
  fun getDevMenuManager(): DevMenuManagerInterface
}
