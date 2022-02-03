package expo.modules.haptics

import android.content.Context
import expo.modules.core.BasePackage

class HapticsPackage : BasePackage() {
  override fun createExportedModules(context: Context) =
    listOf(HapticsModule(context))
}
