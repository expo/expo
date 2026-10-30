package expo.modules.kotlin

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.services.Service

interface ModulesProvider {
  fun getModulesMap(): Map<Class<out Module>, String?>

  /**
   * Returns the names of the packages that the modules returned by [getModulesMap] are exported in: the name of the
   * npm package that provides the module, or [LOCAL_PACKAGE_NAME] for local and inline modules.
   */
  fun getModulePackageNames(): Map<Class<out Module>, String> = emptyMap()

  companion object {
    /**
     * Name of the package of local and inline modules. It can't be the name of an npm package.
     */
    const val LOCAL_PACKAGE_NAME = "\$local"
  }

  fun getServices(): List<Class<out Service>> = emptyList()
}
