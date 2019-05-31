package expo.modules.camera2

import android.content.Context

import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule
import org.unimodules.core.ViewManager

class Camera2Package : BasePackage() {
    override fun createExportedModules(context: Context): List<ExportedModule> {
        return listOf(Camera2ViewManagerModule(context) as ExportedModule)
    }

    override fun createViewManagers(context: Context): List<ViewManager<*>> {
        return listOf(Camera2ViewManager() as ViewManager<*>)
    }
}
