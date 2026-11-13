package expo.modules

import expo.modules.v2.ExpoModulesV2Provider
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.discoveredExpoModules

/**
 * The list is filled in at compile time: the Expo Modules v2 compiler plugin, which autolinking
 * applies to this project, expands `discoveredExpoModules()` into every `@ExpoModule` on the compile
 * classpath. Autolinking adds every module project as a dependency of this one, so the classpath is
 * exactly the set of installed modules and nothing has to be listed anywhere.
 */
class ExpoModulesV2ModuleList : ExpoModulesV2Provider {
  override fun getModules(): List<Class<out Module>> = discoveredExpoModules()
}
