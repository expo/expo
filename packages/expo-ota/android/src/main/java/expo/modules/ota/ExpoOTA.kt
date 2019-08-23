package expo.modules.ota

import android.content.Context
import android.util.Log
import okhttp3.OkHttpClient
import org.json.JSONObject
import java.io.File
import java.util.*
import java.util.concurrent.TimeUnit

const val KEY_MANIFEST_BUNDLE_URL = "bundleUrl"

class ExpoOTA(private val context: Context, private val config: ExpoOTAConfig, private val loadFromBundler: Boolean) {

    private val persistence = ExpoOTAPersistenceFactory.INSTANCE.persistence(context, config.id)

    var bundlePath = if(loadFromBundler) null else persistence.bundlePath

    fun init() {
        if (!loadFromBundler) {
            checkAndDownloadUpdate(context, persistence.manifest, config, this::saveManifestAndBundle,{}) { Log.e("ExpoOTA", "Error while updating: ", it) }
        }
    }

    private fun saveManifestAndBundle(manifest: JSONObject, path: String) {
        persistence.manifest = manifest
        persistence.bundlePath = path
    }

}