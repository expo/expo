package expo.modules.ota

import android.content.Context
import com.jakewharton.processphoenix.ProcessPhoenix
import org.json.JSONObject
import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod

class OtaModule(context: Context) : ExportedModule(context) {

    private var moduleRegistry: ModuleRegistry? = null

    override fun getName(): String {
        return NAME
    }

    override fun onCreate(moduleRegistry: ModuleRegistry) {
        this.moduleRegistry = moduleRegistry
    }

    @ExpoMethod
    fun checkForUpdateAsync(username: String, slug: String, releaseChannel: String, sdkVersion: String, promise: Promise) {
        val manifestRequestConfig = ExpoManifestConfig(username, slug, releaseChannel, sdkVersion)
        downloadManifest(manifestRequestConfig, manifestHandler(slug, promise)) { e -> promise.reject("E_FETCH_MANIFEST_FAILED", e) }
    }

    private fun manifestHandler(id: String, promise: Promise): (JSONObject) -> Unit = { manifest ->
        val persistence = ExpoOTAPersistenceFactory.INSTANCE.persistence(context, id)
        val manifestComparator = VersionNumberManifestComparator()
        if (manifestComparator.shouldDownloadBundle(persistence.manifest, manifest)) {
            promise.resolve(manifest.toString())
        } else {
            promise.resolve(false)
        }
    }

    @ExpoMethod
    fun reload() {
        ProcessPhoenix.triggerRebirth(context)
    }

    @ExpoMethod
    fun reloadFromCache() {
        reload()
    }

    @ExpoMethod
    fun fetchUpdatesAsync(username: String, slug: String, releaseChannel: String, sdkVersion: String, promise: Promise) {
        val persistence = ExpoOTAPersistenceFactory.INSTANCE.persistence(context, slug)
        val manifestRequestConfig = ExpoManifestConfig(username, slug, releaseChannel, sdkVersion)
        val otaConfig = ExpoOTAConfig(manifestRequestConfig, slug)
        checkAndDownloadUpdate(context, persistence.manifest, otaConfig,
                handleUpdate(persistence, promise),
                { promise.resolve(null) },
                { e -> promise.reject("E_UPDATE_FAILED", e)})
    }

    private fun handleUpdate(persistance: ExpoOTAPersistence, promise: Promise): (manifest: JSONObject, path: String) -> Unit =
            { manifest, path ->
                persistance.bundlePath = path
                persistance.manifest = manifest
                promise.resolve(manifest.toString())
            }

    companion object {
        private val NAME = "ExpoOta"
        private val TAG = "expo.modules.expo.modules.ota.OtaModule"
    }
}
