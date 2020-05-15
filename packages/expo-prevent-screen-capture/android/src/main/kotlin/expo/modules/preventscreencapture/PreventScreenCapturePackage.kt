package expo.modules.preventscreencapture

import android.content.Context

import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule
import org.unimodules.core.ViewManager

class PreventScreenCapurePackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(PreventScreenCapureModule(context) as ExportedModule)
  }

}

