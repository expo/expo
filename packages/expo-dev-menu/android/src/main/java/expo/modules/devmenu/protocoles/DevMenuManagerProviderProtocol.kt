package expo.modules.devmenu.protocoles

@FunctionalInterface
interface DevMenuManagerProviderProtocol {
  fun getDevMenuManager(): DevMenuManagerProtocol
}
