package expo.modules.preventscreencapture

import android.content.Context

import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule
import org.unimodules.core.ViewManager

class PreventScreenCapturePackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(PreventScreenCaptureModule(context) as ExportedModule)
  }

}

