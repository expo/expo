package abi46_0_0.expo.modules.kotlin

import abi46_0_0.expo.modules.kotlin.modules.Module

interface ModulesProvider {
  fun getModulesList(): List<Class<out Module>>
}
