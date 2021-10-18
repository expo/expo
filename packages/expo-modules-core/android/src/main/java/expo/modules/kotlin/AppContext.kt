package expo.modules.kotlin

class AppContext(
  modulesProvider: ModulesProvider,
  val legacyModuleRegistry: expo.modules.core.ModuleRegistry
) {
  val registry = ModuleRegistry().register(modulesProvider)
}
