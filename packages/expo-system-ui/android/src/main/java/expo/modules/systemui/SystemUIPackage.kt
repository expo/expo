package expo.modules.systemui

import android.content.Context
import expo.modules.core.BasePackage

class SystemUIPackage : BasePackage() {
  override fun createExportedModules(context: Context) = listOf(SystemUIModule(context))
}
