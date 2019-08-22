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

    private val bundleDir = "bundle-${config.id}"
    private val persistence = ExpoOTAPersistence(context, config.id)

    var bundlePath = persistence.bundlePath

    fun init() {
        if (!loadFromBundler) {
            downloadUpdateIfAvailable({ _, path -> Log.i("ExpoOTA", "Bundle downloaded and saved at: $path") }) { Log.e("ExpoOTA", "Error while updating: ", it) }
        }
    }

    fun downloadUpdateIfAvailable(success: (manifest: JSONObject, bundlePath: String) -> Unit, error: (java.lang.Exception) -> Unit) {
        downloadManifest(config.manifestConfig ,{ manifest ->
            if (config.manifestComparator.shouldDownloadBundle(persistence.manifest, manifest)) {
                downloadBundle(manifest, {
                    saveManifestAndBundle(manifest, it)
                    success(manifest, it)
                }) { error(it) }
            }
        }) { error(it) }
    }


    private fun saveManifestAndBundle(manifest: JSONObject, path: String) {
        persistence.manifest = manifest
        persistence.bundlePath = path
    }

    private fun downloadBundle(manifest: JSONObject, success: (String) -> Unit, error: (java.lang.Exception) -> Unit) {
        val bundleUrl = manifest.optString(KEY_MANIFEST_BUNDLE_URL)
        val bundleLoader = BundleLoader(context, bundleClient())
        val bundleDir = File(context.filesDir, bundleDir)
        bundleLoader.loadJsBundle(BundleLoader.BundleLoadParams(bundleUrl, bundleDir, bundleFilename(), Collections.emptyList()), object : BundleLoader.BundleLoadCallback {
            override fun bundleLoaded(path: String) {
                success(path)
            }

            override fun error(e: Exception) {
                error(e)
            }
        })
    }

    private fun bundleFilename(): String {
        return "bundle_${System.currentTimeMillis()}"
    }

    private fun bundleClient(): OkHttpClient {
        return config.bundleHttpClient ?: longTimeoutHttpClient()
    }

    private fun longTimeoutHttpClient(): OkHttpClient {
        return OkHttpClient.Builder().callTimeout(2, TimeUnit.MINUTES).build()
    }

}