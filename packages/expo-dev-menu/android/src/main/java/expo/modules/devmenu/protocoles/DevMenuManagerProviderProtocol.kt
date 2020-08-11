package expo.modules.devmenu.protocoles

@FunctionalInterface
interface DevMenuManagerProviderProtocol {
  /**
   * Provide access to the object implementing the [DevMenuManagerProtocol] interface.
   */
  fun getDevMenuManager(): DevMenuManagerProtocol
}
