package expo.modules.kotlin.v2

import io.github.expo.modules.v2.modules.Module

interface ExpoModulesV2Provider {
  fun getModules(): List<Class<out Module>>
}
