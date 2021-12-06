package abi44_0_0.expo.modules.analytics.amplitude

import android.content.Context
import abi44_0_0.expo.modules.core.BasePackage
import abi44_0_0.expo.modules.core.ExportedModule

class AmplitudePackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(AmplitudeModule(context))
  }
}
