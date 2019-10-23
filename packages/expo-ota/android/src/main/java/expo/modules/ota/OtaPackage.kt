package expo.modules.ota

import android.content.Context
import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule
import java.util.Collections.singletonList

class OtaPackage @JvmOverloads constructor(private var id: String? = null) : BasePackage() {

    override fun createExportedModules(context: Context): List<ExportedModule> {
        val persistence = ExpoOTAPersistenceFactory.persistence(context, id)
        val updater = OtaUpdater(context, persistence, persistence.config!!, persistence.id!!)
        return singletonList<ExportedModule>(OtaModule(context, persistence, updater) as ExportedModule)
    }

}
