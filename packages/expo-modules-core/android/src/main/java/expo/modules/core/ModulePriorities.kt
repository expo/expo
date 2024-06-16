package expo.modules.core

/**
 * This class determines the order of the following handlers/listeners
 * - {@link ReactNativeHostHandler}
 * - {@link ApplicationLifecycleListener}
 * - {@link ReactActivityLifecycleListener}
 * - {@link ReactActivityHandler}
 *
 * The priority is only for internal use and we maintain a pre-defined {@link SUPPORTED_MODULES} map.
 */
object ModulePriorities {
  fun get(packageName: String?): Int {
    return packageName?.let {
      return SUPPORTED_MODULES[it] ?: 0
    } ?: 0
  }

  private val SUPPORTED_MODULES = mapOf(
    // {key} to {value}
    // key: full qualified class name
    // value: priority value, the higher value takes precedence
    "expo.modules.splashscreen.SplashScreenPackage" to 11,
    "expo.modules.updates.UpdatesPackage" to 10
  )
}
