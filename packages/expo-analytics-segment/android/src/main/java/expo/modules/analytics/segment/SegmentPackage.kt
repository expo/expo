package expo.modules.analytics.segment

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class SegmentPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(SegmentModule(context))
  }
}
