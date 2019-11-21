package expo.modules.ota

import android.content.Context
import android.util.Log
import org.json.JSONObject

const val KEY_MANIFEST_BUNDLE_URL = "bundleUrl"
const val DEFAULT_EXPO_OTA_ID = "defaultId"

@Suppress("unused")
class ExpoOTA private constructor(context: Context, config: ExpoOTAConfig, private val loadFromBundler: Boolean, id: String) {

    companion object {

        @JvmStatic @JvmOverloads fun init(context: Context, loadFromBundler: Boolean = true): ExpoOTA {
            val config = embeddedManifestExpoConfig(context)
            return init(context, config, loadFromBundler)
        }

        @JvmStatic @JvmOverloads fun init(context: Context, config: ExpoOTAConfig, loadFromBundler: Boolean, id: String = DEFAULT_EXPO_OTA_ID): ExpoOTA {
            val ota = ExpoOTA(context, config, loadFromBundler, id)
            if(config.checkForUpdatesAutomatically) {
                ota.start()
            }
            return ota
        }
    }

    private val persistence = ExpoOTAPersistenceFactory.persistence(context, id, true)
    private val updater = if (persistence != null) OtaUpdater.createUpdater(context, persistence, config, id) else null

    init {
        if(persistence != null) {
            persistence.config = config
            persistence.id = id
        }
    }

    var bundlePath = if(loadFromBundler || persistence == null) null else persistence.bundlePath

    fun start() {
        if(updater != null) {
            updater.removeOutdatedBundle()
            if (!loadFromBundler) {
                updater.checkAndDownloadUpdate(this::saveManifestAndBundle,{}) { Log.e("ExpoOTA", "Error while updating: ", it) }
            }
        }
    }

    private fun saveManifestAndBundle(manifest: JSONObject, path: String) {
        if(updater != null) {
            updater.saveDownloadedManifestAndBundlePath(manifest, path)
            updater.markDownloadedCurrentAndCurrentOutdated()
        }
    }

}