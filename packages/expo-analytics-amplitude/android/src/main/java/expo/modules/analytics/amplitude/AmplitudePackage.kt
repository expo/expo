package expo.modules.analytics.amplitude

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class AmplitudePackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(AmplitudeModule(context))
  }
}
