package expo.modules.screencapture

import android.content.Context

import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule

class ScreenCapturePackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(ScreenCaptureModule(context) as ExportedModule)
  }
}
