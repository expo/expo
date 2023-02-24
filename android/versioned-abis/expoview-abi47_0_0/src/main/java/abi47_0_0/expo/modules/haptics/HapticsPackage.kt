package abi47_0_0.expo.modules.haptics

import android.content.Context
import abi47_0_0.expo.modules.core.BasePackage

class HapticsPackage : BasePackage() {
  override fun createExportedModules(context: Context) =
    listOf(HapticsModule(context))
}
