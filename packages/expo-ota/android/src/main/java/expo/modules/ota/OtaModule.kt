package expo.modules.ota

import android.content.Context
import com.jakewharton.processphoenix.ProcessPhoenix
import org.json.JSONObject
import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod
import java.io.IOException
import java.lang.Exception
import java.lang.IllegalStateException

class OtaModule(context: Context, private val persistence: ExpoOTAPersistence, private val updater: OtaUpdater) : ExportedModule(context) {

    private var moduleRegistry: ModuleRegistry? = null

    override fun getName(): String {
        return NAME
    }

    override fun onCreate(moduleRegistry: ModuleRegistry) {
        this.moduleRegistry = moduleRegistry
    }

    @ExpoMethod
    fun checkForUpdateAsync(promise: Promise) {
        updater.downloadManifest(manifestHandler(promise)) { e -> promise.reject("E_FETCH_MANIFEST_FAILED", e) }
    }

    private fun manifestHandler(promise: Promise): (JSONObject) -> Unit = { manifest ->
        val manifestComparator = VersionNumberManifestComparator()
        if (manifestComparator.shouldDownloadBundle(persistence.newestManifest, manifest)) {
            promise.resolve(manifest.toString())
        } else {
            promise.resolve(false)
        }
    }

    @ExpoMethod
    fun reload(promise: Promise) {
        try {
            updater.markDownloadedAsCurrent()
            ProcessPhoenix.triggerRebirth(context)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject(e)
        }
    }

    @ExpoMethod
    fun reloadFromCache(promise: Promise) {
        reload(promise)
    }

    @ExpoMethod
    fun clearUpdateCacheAsync(promise: Promise) {
        updater.removeDownloadedBundle()
        promise.resolve(true)
    }

    @ExpoMethod
    fun fetchUpdatesAsync(promise: Promise) {
        if (persistence.config != null) {
            updater.checkAndDownloadUpdate(handleUpdate(promise),
                    { promise.resolve(null) },
                    { e -> promise.reject("E_UPDATE_FAILED", e) })
        } else {
            throwUninitializedExpoOtaError()
        }
    }

    private fun handleUpdate(promise: Promise): (manifest: JSONObject, path: String) -> Unit =
            { manifest, path ->
                updater.saveDownloadedManifestAndBundlePath(manifest, path)
                promise.resolve(manifest.toString())
            }

    companion object {
        private val NAME = "ExpoOta"
    }
}
