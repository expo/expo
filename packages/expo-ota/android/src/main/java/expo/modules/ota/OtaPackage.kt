package expo.modules.ota

import android.content.Context

import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule
import org.unimodules.core.ViewManager
import java.util.Collections.emptyList
import java.util.Collections.singletonList

class OtaPackage : BasePackage() {
    override fun createExportedModules(context: Context): List<ExportedModule> {
        return singletonList<ExportedModule>(OtaModule(context) as ExportedModule)
    }

    override fun createViewManagers(context: Context): List<ViewManager<*>> {
        return emptyList<ViewManager<*>>()
    }
}
