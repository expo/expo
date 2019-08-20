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
    private val downloader = ManifestDownloader(config.manifestConfig.url, config.manifestConfig.headers, config.manifestHttpClient)

    var bundlePath = persistence.bundlePath

    fun init() {
        if (!loadFromBundler) {
            downloadManifest(this::handleDownloadedManifest) { Log.e("WHOOPS", "Error while loading manifest", it) }
        }
    }

    private fun downloadManifest(success: (JSONObject) -> Unit, errorHandler: (java.lang.Exception) -> Unit) {
        downloader.downloadManifest(object : ManifestDownloader.ManifestDownloadCallback {
            override fun onSuccess(manifest: JSONObject) {
                success(manifest)
            }

            override fun onError(error: Exception) {
                errorHandler(error)
            }
        })
    }

    private fun handleDownloadedManifest(manifest: JSONObject) {
        if (config.manifestComparator.shouldDownloadBundle(persistence.manifest, manifest)) {
            downloadBundle(manifest)
        }
    }


    private fun saveManifestAndBundle(manifest: JSONObject, path: String) {
        persistence.manifest = manifest
        persistence.bundlePath = path
    }

    private fun downloadBundle(manifest: JSONObject) {
        val bundleUrl = manifest.optString(KEY_MANIFEST_BUNDLE_URL)
        val bundleLoader = BundleLoader(context, bundleClient())
        val bundleDir = File(context.filesDir, bundleDir)
        bundleLoader.loadJsBundle(BundleLoader.BundleLoadParams(bundleUrl, bundleDir, bundleFilename(), Collections.emptyList()), object : BundleLoader.BundleLoadCallback {
            override fun bundleLoaded(path: String) {
                saveManifestAndBundle(manifest, path)
            }

            override fun error(e: Exception) {
                Log.e("WHOOPS", "Error while loading bundle")
            }
        })

    }

    private fun bundleFilename(): String {
        return "bundle_${System.currentTimeMillis()}"
    }

    private fun bundleClient(): OkHttpClient {
        return config.bundleHttpClient?:longTimeoutHttpClient()
    }

    private fun longTimeoutHttpClient(): OkHttpClient {
        return OkHttpClient.Builder().callTimeout(2, TimeUnit.MINUTES).build()
    }

}