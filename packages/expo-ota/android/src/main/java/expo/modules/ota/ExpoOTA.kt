package expo.modules.ota

import android.content.Context
import android.util.Log
import org.json.JSONObject

const val KEY_MANIFEST_BUNDLE_URL = "bundleUrl"
const val DEFAULT_EXPO_OTA_ID = "defaultId"

@Suppress("unused")
class ExpoOTA private constructor(context: Context, config: ExpoOTAConfig, private val loadFromBundler: Boolean, id: String) {

    companion object {

        var id: String = DEFAULT_EXPO_OTA_ID

        @JvmStatic @JvmOverloads fun create(context: Context, config: ExpoOTAConfig, loadFromBundler: Boolean, id: String = DEFAULT_EXPO_OTA_ID): ExpoOTA {
            ExpoOTA.id = id
            return ExpoOTA(context, config, loadFromBundler, id)
        }
    }

    private val persistence = ExpoOTAPersistenceFactory.persistence(context, id)
    private val updater = OtaUpdater(context, persistence, id)

    init {
        persistence.config = config
    }

    var bundlePath = if(loadFromBundler) null else persistence.bundlePath

    fun init() {
        updater.removeOutdatedBundle()
        if (!loadFromBundler) {
            updater.checkAndDownloadUpdate(this::saveManifestAndBundle,{}) { Log.e("ExpoOTA", "Error while updating: ", it) }
        }
    }

    private fun saveManifestAndBundle(manifest: JSONObject, path: String) {
        updater.saveDownloadedManifestAndBundlePath(manifest, path)
        updater.markDownloadedAsCurrent()
    }

}