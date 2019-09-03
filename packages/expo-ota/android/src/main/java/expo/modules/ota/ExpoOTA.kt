package expo.modules.ota

import android.content.Context
import android.util.Log
import okhttp3.OkHttpClient
import org.json.JSONObject
import java.io.File
import java.util.*
import java.util.concurrent.TimeUnit

const val KEY_MANIFEST_BUNDLE_URL = "bundleUrl"
const val DEFAULT_EXPO_OTA_ID = "default"

class ExpoOTA @JvmOverloads constructor(context: Context, config: ExpoOTAConfig, private val loadFromBundler: Boolean, id: String = DEFAULT_EXPO_OTA_ID) {

    private val persistence = ExpoOTAPersistenceFactory.persistence(context, id)
    private val updater = OtaUpdater(context, persistence, id)

    init {
        persistence.config = config
    }

    var bundlePath = if(loadFromBundler) null else persistence.bundlePath

    fun init() {
        if (!loadFromBundler) {
            updater.checkAndDownloadUpdate(this::saveManifestAndBundle,{}) { Log.e("ExpoOTA", "Error while updating: ", it) }
        }
        updater.removeDownloadedBundle()
    }

    private fun saveManifestAndBundle(manifest: JSONObject, path: String) {
        updater.saveDownloadedManifestAndBundlePath(manifest, path)
        updater.markDownloadedAsCurrent()
    }

}