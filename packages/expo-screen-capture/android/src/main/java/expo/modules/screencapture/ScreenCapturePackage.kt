package expo.modules.screencapture

import android.content.Context

import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class ScreenCapturePackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(ScreenCaptureModule(context) as ExportedModule)
  }
}
