package expo.modules.ota

import android.content.Context

import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod

class OtaModule(context: Context) : ExportedModule(context) {

    private var mModuleRegistry: ModuleRegistry? = null

    override fun getName(): String {
        return NAME
    }


    override fun onCreate(moduleRegistry: ModuleRegistry) {
        this.mModuleRegistry = mModuleRegistry
    }

    @ExpoMethod
    fun someGreatMethodAsync(options: Map<String, Any>, promise: Promise) {
    }

    companion object {
        private val NAME = "ExpoOta"
        private val TAG = "expo.modules.ota.OtaModule"
    }
}
