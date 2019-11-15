package expo.modules.ota

import android.content.Context
import okhttp3.*
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.util.concurrent.TimeUnit

class OtaUpdater constructor(
        private val persistence: ExpoOTAPersistence,
        private val config: ExpoOTAConfig,
        private val id: String,
        private val embeddedManifestAndBundle: EmbeddedManifestAndBundle,
        private val bundleLoader: BundleLoader,
        private val fileOperator: FileOperator) {

    companion object {
        val updatersMap = HashMap<String, OtaUpdater>()

        private fun bundleClient(config: ExpoOTAConfig): OkHttpClient {
            return config.bundleHttpClient ?: longTimeoutHttpClient()
        }

        private fun longTimeoutHttpClient(): OkHttpClient {
            return OkHttpClient.Builder().callTimeout(2, TimeUnit.MINUTES).build()
        }

        @JvmStatic
        fun createUpdater(context: Context, persistence: ExpoOTAPersistence, config: ExpoOTAConfig, id: String): OtaUpdater {
            if (!updatersMap.containsKey(id)) {
                updatersMap.put(id, OtaUpdater(
                        persistence,
                        config,
                        id,
                        EmbeddedManifestAndBundle(context),
                        BundleLoader(bundleClient(config)),
                        FileOperator(context.filesDir)))
            }
            return updatersMap[id]!!
        }

    }

    var updateEvents: UpdatesEventEmitter? = null

    init {
        checkAssetsBundleAndManifest()
        if (persistence.enqueuedReorderAtNextBoot) {
            markDownloadedCurrentAndCurrentOutdated()
            removeOutdatedBundle()
            persistence.enqueuedReorderAtNextBoot = false
        }
    }

    fun checkAndDownloadUpdate(success: (manifest: JSONObject, path: String) -> Unit,
                               updateUnavailable: (manifest: JSONObject) -> Unit,
                               error: (Exception?) -> Unit) {
        downloadManifest({ manifest ->
            if (shouldReplaceBundle(persistence.newestManifest, manifest)) {
                updateEvents?.emitDownloadStarted()
                downloadBundle(manifest, {
                    updateEvents?.emitDownloadFinished()
                    success(manifest, it)
                }) { error(it) }
            } else {
                updateEvents?.emitDownloadNotAvailable()
                updateUnavailable(manifest)
            }
        }) {
            updateEvents?.emitError()
            error(it)
        }
    }

    private fun shouldReplaceBundle(currentManifest: JSONObject, manifestToReplace: JSONObject) =
            config.manifestComparator.shouldReplaceBundle(currentManifest, manifestToReplace)


    private fun createManifestRequest(config: ExpoOTAConfig): Request {
        val requestBuilder = Request.Builder()
        requestBuilder.url(config.manifestUrl)
        config.manifestHeaders.forEach { requestBuilder.addHeader(it.key, it.value) }
        return requestBuilder.build()
    }

    fun downloadManifest(success: (JSONObject) -> Unit, error: (Exception) -> Unit) {
        config.manifestHttpClient.newCall(createManifestRequest(config)).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                error(IllegalStateException("Manifest fetching failed: ", e))
            }

            override fun onResponse(call: Call, response: Response) {
                if (response.isSuccessful) {
                    if (response.body() != null) {
                        verifyManifest(response, success, error)
                    } else {
                        error(IllegalStateException("Response body is null: ", response.body()))
                    }
                } else {
                    error(IllegalStateException("Response not successful. Code: " + response.code() + ", body: " + response.body()?.toString()))
                }
            }
        })
    }

    fun verifyManifest(response: Response, success: (JSONObject) -> Unit, error: (Exception) -> Unit) {
        config.manifestResponseValidator.validate(response, {
            success(JSONObject(it))
        }, error)
    }

    fun saveDownloadedManifestAndBundlePath(manifest: JSONObject, path: String) {
        val previousBundle = persistence.downloadedBundlePath
        if (previousBundle != null) {
            fileOperator.removeFile(previousBundle) // TODO: Move to persistence!
        }
        persistence.downloadedManifest = manifest
        persistence.downloadedBundlePath = path
    }

    fun prepareToReload() {
        persistence.enqueuedReorderAtNextBoot = true
        persistence.synchronize()
    }

    fun markDownloadedCurrentAndCurrentOutdated() {
        val outdated = persistence.outdatedBundlePath
        if (outdated != null) {
            fileOperator.removeFile(outdated)
        }
        persistence.markDownloadedCurrentAndCurrentOutdated()
    }

    fun removeOutdatedBundle() {
        val outdatedBundlePath = persistence.outdatedBundlePath
        persistence.outdatedBundlePath = null
        if (outdatedBundlePath != null) {
            fileOperator.removeFile(outdatedBundlePath)
        }
    }

    fun cleanUnusedFiles() {
        val bundlesDir = bundleDir()
        if (bundlesDir.exists() && bundlesDir.isDirectory) {
            bundlesDir.listFiles { directory, filename -> !validFilesSet.contains(File(directory, filename).path) }
                    .forEach { fileOperator.removeFile(it.path) }
        }
    }

    private fun checkAssetsBundleAndManifest() {
        if (shouldCopyAssetsManifestAndBundle()) {
            val embeddedManifest: JSONObject = embeddedManifestAndBundle.readManifest()
            fileOperator.saveResponseToFile(bundleDir(), bundleFilename(embeddedManifest))(embeddedManifestAndBundle.readBundle(), {
                saveDownloadedManifestAndBundlePath(embeddedManifest, it)
                markDownloadedCurrentAndCurrentOutdated()
            }, {})
        }
    }

    private fun shouldCopyAssetsManifestAndBundle(): Boolean {
        val embeddedManifest: JSONObject = embeddedManifestAndBundle.readManifest()
        return !embeddedManifestAndBundle.isEmbeddedManifestCompatibleWith(persistence.newestManifest)
                || shouldReplaceBundle(persistence.newestManifest, embeddedManifest)
    }

    private val validFilesSet: Set<String>
        get() {
            val bundlePath = persistence.bundlePath
            val downloadedBundlePath = persistence.downloadedBundlePath
            var validFilesSet = setOf<String>()
            if (bundlePath != null) {
                validFilesSet = validFilesSet.plus(bundlePath)
            }
            if (downloadedBundlePath != null) {
                validFilesSet = validFilesSet.plus(downloadedBundlePath)
            }
            return validFilesSet
        }

    private fun downloadBundle(manifest: JSONObject, success: (String) -> Unit, error: (Exception?) -> Unit) {
        val bundleUrl = manifest.optString(KEY_MANIFEST_BUNDLE_URL)
        val params = BundleLoader.BundleLoadParams(bundleUrl, bundleDir(), bundleFilename(manifest))
        bundleLoader.loadJsBundle(params, { _, stream ->
            fileOperator.saveResponseToFile(params.directory, params.fileName)(stream, success, error)
        }, error)
    }

    private fun bundleFilename(manifest: JSONObject): String {
        return "${bundleFilePrefix()}_${manifest.optString("version")}_${System.currentTimeMillis()}"
    }

    private fun bundleFilePrefix(): String {
        return "bundle_${config.channelIdentifier}"
    }

    private fun bundleDir(): File {
        return fileOperator.dirPath("bundle-$id")
    }
}