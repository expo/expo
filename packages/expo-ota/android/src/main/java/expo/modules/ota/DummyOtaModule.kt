package expo.modules.ota

import android.content.Context
import org.json.JSONObject
import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod
import java.lang.IllegalStateException

class DummyOtaModule(context: Context) : ExportedModule(context) {

    override fun getName(): String {
        return NAME
    }

    override fun onCreate(moduleRegistry: ModuleRegistry) {
    }

    @ExpoMethod
    fun checkForUpdateAsync(promise: Promise) {
        rejectNotSupported(promise)
    }

    @ExpoMethod
    fun reload(promise: Promise) {
        rejectNotSupported(promise)
    }

    @ExpoMethod
    fun clearUpdateCacheAsync(promise: Promise) {
        rejectNotSupported(promise)
    }

    @ExpoMethod
    fun fetchUpdateAsync(promise: Promise) {
        rejectNotSupported(promise)
    }

    @ExpoMethod
    fun readCurrentManifestAsync(promise: Promise) {
        rejectNotSupported(promise)
    }

    private fun rejectNotSupported(promise: Promise) {
        promise.reject(IllegalStateException("Expo-ota not initialized"))
    }

    companion object {
        private const val NAME = "ExpoOta"
    }
}
