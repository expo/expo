package versioned.host.exp.exponent

import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.SingletonModule
import versioned.host.exp.exponent.modules.universal.ExpoModuleRegistryAdapter

interface ExponentPackageDelegate {
  fun getScopedModuleRegistryAdapterForPackages(
    packages: List<Package>,
    singletonModules: List<SingletonModule>
  ): ExpoModuleRegistryAdapter?
}
