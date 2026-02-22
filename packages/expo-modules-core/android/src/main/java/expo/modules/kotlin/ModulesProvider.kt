package expo.modules.kotlin

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.services.Service

interface ModulesProvider {
  fun getModulesMap(): Map<Class<out Module>, String?>

  fun getServices(): List<Class<out Service>> = emptyList()
}
