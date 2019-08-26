package expo.modules.ota

import android.content.Context

import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule
import org.unimodules.core.ViewManager
import java.util.Collections.emptyList
import java.util.Collections.singletonList

class OtaPackage @JvmOverloads constructor(val id: String = DEFAULT_EXPO_OTA_ID) : BasePackage() {

    override fun createExportedModules(context: Context): List<ExportedModule> {
        val persistence = ExpoOTAPersistenceFactory.INSTANCE.persistence(context, id)
        val updater = OtaUpdater(context, persistence, id)
        return singletonList<ExportedModule>(OtaModule(context, persistence, updater) as ExportedModule)
    }

    override fun createViewManagers(context: Context): List<ViewManager<*>> {
        return emptyList<ViewManager<*>>()
    }
}
