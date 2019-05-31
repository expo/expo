package expo.modules.camera2

import android.content.Context

import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod
import org.unimodules.core.interfaces.ModuleRegistryConsumer

class Camera2ViewManagerModule(context: Context) : ExportedModule(context), ModuleRegistryConsumer {

    companion object {
        private const val TAG = "ExpoCamera2ViewManager"
    }

    private var mModuleRegistry: ModuleRegistry? = null

    override fun getName(): String {
        return TAG
    }

    override fun setModuleRegistry(moduleRegistry: ModuleRegistry) {
        mModuleRegistry = moduleRegistry
    }

}
