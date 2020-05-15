package expo.modules.preventscreenshot

import android.content.Context

import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule
import org.unimodules.core.ViewManager

class PreventScreenshotPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(PreventScreenshotModule(context) as ExportedModule)
  }

}

