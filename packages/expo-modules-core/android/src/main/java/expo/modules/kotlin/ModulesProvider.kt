package expo.modules.kotlin

import expo.modules.kotlin.modules.Module

interface ModulesProvider {
  fun getModulesMap(): Map<Class<out Module>, String?>
}
