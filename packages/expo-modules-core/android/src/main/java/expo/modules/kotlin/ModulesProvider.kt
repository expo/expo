package expo.modules.kotlin

import expo.modules.kotlin.modules.Module

interface ModulesProvider {
  fun getModulesList(): List<Class<out Module>>
}
