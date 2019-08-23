package expo.modules.ota

import android.content.Context
import okhttp3.OkHttpClient
import org.json.JSONObject
import java.io.File
import java.util.*
import java.util.concurrent.TimeUnit

fun checkAndDownloadUpdate(
        context: Context,
        oldManifest: JSONObject,
        config: ExpoOTAConfig,
        success: (manifest: JSONObject, path: String) -> Unit,
        updateUnavailable: (manifest: JSONObject) -> Unit,
        error: (Exception?) -> Unit) {
    downloadManifest(config.manifestConfig ,{ manifest ->
        if (config.manifestComparator.shouldDownloadBundle(oldManifest, manifest)) {
            downloadBundle(context, config, manifest, {
                success(manifest, it)
            }) { error(it) }
        } else {
            updateUnavailable(manifest)
        }
    }) { error(it) }
}

private fun downloadBundle(context: Context, config: ExpoOTAConfig, manifest: JSONObject, success: (String) -> Unit, error: (Exception?) -> Unit) {
    val bundleUrl = manifest.optString(KEY_MANIFEST_BUNDLE_URL)
    val bundleLoader = BundleLoader(context, bundleClient(config))
    val bundleDir = File(context.filesDir, bundleDir(config.id))
    bundleLoader.loadJsBundle(BundleLoader.BundleLoadParams(bundleUrl, bundleDir, bundleFilename(), Collections.emptyList()), success, error)
}

private fun bundleFilename(): String {
    return "bundle_${System.currentTimeMillis()}"
}

private fun bundleClient(config: ExpoOTAConfig): OkHttpClient {
    return config.bundleHttpClient ?: longTimeoutHttpClient()
}

private fun longTimeoutHttpClient(): OkHttpClient {
    return OkHttpClient.Builder().callTimeout(2, TimeUnit.MINUTES).build()
}

private fun bundleDir(id: String): String {
    return "bundle-$id"
}