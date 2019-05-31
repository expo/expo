package expo.modules.camera2

import android.content.Context

import org.unimodules.core.ModuleRegistry
import org.unimodules.core.ViewManager
import org.unimodules.core.interfaces.ExpoProp
import org.unimodules.core.interfaces.ModuleRegistryConsumer
import expo.modules.camera2.settings.Facing

class Camera2ViewManager : ViewManager<Camera2View>(), ModuleRegistryConsumer {

    companion object {
        private const val TAG = "ExpoCamera2View"
    }

    private lateinit var mModuleRegistry: ModuleRegistry

    override fun getName(): String {
        return TAG
    }

    override fun createViewInstance(context: Context): Camera2View {
        return Camera2View(context)
    }

    override fun getViewManagerType(): ViewManagerType {
        return ViewManagerType.SIMPLE
    }

    override fun setModuleRegistry(moduleRegistry: ModuleRegistry) {
        mModuleRegistry = moduleRegistry
    }

    @ExpoProp(name = "facing")
    internal fun setFacing(view: Camera2View, facing: String) {
        view.setFacing(facing = Facing.valueOf(facing))
    }
}
