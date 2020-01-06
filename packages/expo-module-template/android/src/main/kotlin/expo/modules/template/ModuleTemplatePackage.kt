package expo.modules.template

import android.content.Context

import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule
import org.unimodules.core.ViewManager

class ModuleTemplatePackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(ModuleTemplateModule(context) as ExportedModule)
  }

  override fun createViewManagers(context: Context): List<ViewManager<*>> {
    return listOf(ModuleTemplateViewManager() as ViewManager<*>)
  }
}
