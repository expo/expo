package expo.modules.ota

import android.content.Context
import okhttp3.*
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.util.*
import java.util.concurrent.TimeUnit
import kotlin.collections.HashSet

class OtaUpdater(private val context: Context, private val persistence: ExpoOTAPersistence, private val id: String) {
    fun checkAndDownloadUpdate(success: (manifest: JSONObject, path: String) -> Unit,
                               updateUnavailable: (manifest: JSONObject) -> Unit,
                               error: (Exception?) -> Unit) {
        downloadManifest({ manifest ->
            if (persistence.config!!.manifestComparator.shouldDownloadBundle(persistence.newestManifest, manifest)) {
                downloadBundle(manifest, {
                    success(manifest, it)
                }) { error(it) }
            } else {
                updateUnavailable(manifest)
            }
        }) { error(it) }
    }


    private fun createRequest(config: ManifestDownloadParams): Request {
        val requestBuilder = Request.Builder()
        requestBuilder.url(config.url)
        config.headers.forEach { requestBuilder.addHeader(it.key, it.value) }
        return requestBuilder.build()
    }

    fun downloadManifest(success: (JSONObject) -> Unit, error: (Exception) -> Unit) {
        if (persistence.config != null) {
            val params = persistence.config!!.manifestConfig
            httpClient(params).newCall(createRequest(params)).enqueue(object : Callback {
                override fun onFailure(call: Call, e: IOException) {
                    error(IllegalStateException("Manifest fetching failed: ", e))
                }

                override fun onResponse(call: Call, response: Response) {
                    if (response.isSuccessful) {
                        if (response.body() != null) {
                            success(JSONObject(response.body()!!.string()))
                        } else {
                            error(IllegalStateException("Response body is null: ", response.body()))
                        }
                    } else {
                        error(IllegalStateException("Response not successful. Code: " + response.code() + ", body: " + response.body()?.toString()))
                    }
                }
            })
        } else {
            throwUninitializedExpoOtaError()
        }
    }

    fun saveDownloadedManifestAndBundlePath(manifest: JSONObject, path: String) {
        persistence.downloadedManifest = manifest
        if (persistence.downloadedBundlePath != null) {
            removeFile(persistence.downloadedBundlePath!!)
        }
        persistence.downloadedBundlePath = path
    }

    fun markDownloadedAsCurrent() {
        persistence.makeDownloadedCurrent()
    }

    fun removeDownloadedBundle() {
        if(persistence.downloadedBundlePath != null) {
            removeFile(persistence.downloadedBundlePath!!)
        }
        persistence.downloadedBundlePath = null
    }

    private fun removeFile(path: String): Boolean {
        val file = File(path)
        return try {
            if (file.exists()) {
                file.delete()
            } else {
                true
            }
        } catch (ignore: IOException) {
            false
        }
    }

    private fun httpClient(params: ManifestDownloadParams) = params.okHttpClient ?: OkHttpClient()

    private fun downloadBundle(manifest: JSONObject, success: (String) -> Unit, error: (Exception?) -> Unit) {
        val bundleUrl = manifest.optString(KEY_MANIFEST_BUNDLE_URL)
        val bundleLoader = BundleLoader(context, bundleClient(persistence.config!!))
        val bundleDir = File(context.filesDir, bundleDir(id))
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
}