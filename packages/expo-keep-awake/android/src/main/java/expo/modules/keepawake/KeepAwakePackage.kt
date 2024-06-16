package expo.modules.keepawake

import android.content.Context

import expo.modules.core.interfaces.InternalModule
import expo.modules.core.interfaces.Package

class KeepAwakePackage : Package {
  override fun createInternalModules(context: Context): List<InternalModule> {
    return listOf(ExpoKeepAwakeManager())
  }
}
