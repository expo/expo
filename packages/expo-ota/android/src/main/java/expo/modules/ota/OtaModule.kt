package expo.modules.ota

import android.content.Context
import org.json.JSONObject
import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod

class OtaModule(context: Context, private val persistence: ExpoOTAPersistence, private val updater: OtaUpdater) : ExportedModule(context) {

    private var moduleRegistry: ModuleRegistry? = null
    private var eventEmitter: UpdatesEventEmitter? = null

    override fun getName(): String {
        return NAME
    }

    override fun onCreate(moduleRegistry: ModuleRegistry) {
        this.moduleRegistry = moduleRegistry
        this.eventEmitter = createUpdatesEventEmitter(moduleRegistry)
        updater.updateEvents = eventEmitter
    }

    @Suppress("unused")
    @ExpoMethod
    fun checkForUpdateAsync(promise: Promise) {
        updater.downloadAndVerifyManifest(manifestHandler(promise)) { e -> promise.reject("E_FETCH_MANIFEST_FAILED", e) }
    }

    private fun manifestHandler(promise: Promise): (JSONObject) -> Unit = { manifest ->
        val manifestComparator = persistence.config!!.manifestComparator
        if (manifestComparator.shouldReplaceBundle(persistence.newestManifest, manifest)) {
            promise.resolve(manifest.toString())
        } else {
            promise.resolve(false)
        }
    }

    @Suppress("unused")
    @ExpoMethod
    fun reload(promise: Promise) {
        try {
            updater.prepareToReload()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject(e)
        }
    }

    @ExpoMethod
    fun clearUpdateCacheAsync(promise: Promise) {
        updater.removeOutdatedBundle()
        updater.cleanUnusedFiles()
        promise.resolve(true)
    }

    @Suppress("unused")
    @ExpoMethod
    fun fetchUpdateAsync(promise: Promise) {
        if (persistence.config != null) {
            updater.checkAndDownloadUpdate(handleUpdate(promise),
                    { promise.resolve(null) },
                    { e -> promise.reject("E_UPDATE_FAILED", e) })
        } else {
            throwUninitializedExpoOtaError()
        }
    }

    @ExpoMethod
    fun readCurrentManifestAsync(promise: Promise) {
        promise.resolve(persistence.manifest.toString())
    }

    private fun handleUpdate(promise: Promise): (manifest: JSONObject, path: String) -> Unit =
            { manifest, path ->
                updater.saveDownloadedManifestAndBundlePath(manifest, path)
                promise.resolve(manifest.toString())
            }

    companion object {
        private const val NAME = "ExpoOta"
    }
}
