package expo.modules.kotlin

import android.util.Log

class ExpoModulesHelper {
  companion object {
    val modulesProvider by lazy {
      try {
        val expoModules = Class.forName("expo.modules.ExpoModulesPackageList")
        expoModules.getConstructor().newInstance() as ModulesProvider
      } catch (e: Exception) {
        Log.e("ExpoModulesHelper", "Couldn't get expo modules list.", e)
        null
      }
    }
  }
}
