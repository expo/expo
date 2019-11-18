package expo.modules.ota

import android.content.Context
import okhttp3.OkHttpClient
import org.json.JSONObject
import java.io.File
import java.util.concurrent.TimeUnit

class OtaUpdater constructor(
        private val persistence: ExpoOTAPersistence,
        private val api: OtaApi,
        private val manifestValidator: ManifestResponseValidator,
        private val manifestComparator: ManifestComparator,
        private val id: String,
        private val channelIdentifier: String,
        private val embeddedManifestAndBundle: EmbeddedManifestAndBundle,
        private val fileOperator: FileOperator) {

    companion object {
        private val updatersMap = HashMap<String, OtaUpdater>()

        private fun bundleClient(config: ExpoOTAConfig): OkHttpClient {
            return config.bundleHttpClient ?: longTimeoutHttpClient()
        }

        private fun longTimeoutHttpClient(): OkHttpClient {
            return OkHttpClient.Builder().callTimeout(2, TimeUnit.MINUTES).build()
        }

        @JvmStatic
        fun createUpdater(context: Context, persistence: ExpoOTAPersistence, config: ExpoOTAConfig, id: String): OtaUpdater {
            if (!updatersMap.containsKey(id)) {
                val updater = OtaUpdater(
                        persistence,
                        ExpoOtaApi(config.manifestHttpClient, config.manifestUrl, config.manifestHeaders, bundleClient(config)),
                        config.manifestResponseValidator,
                        config.manifestComparator,
                        id,
                        config.channelIdentifier,
                        EmbeddedManifestAndBundle(context),
                        FileOperator(context.filesDir))
                updater.initialize()
                updatersMap[id] = updater
            }
            return updatersMap[id]!!
        }

    }

    var updateEvents: UpdatesEventEmitter? = null

    fun initialize() {
        if (persistence.enqueuedReorderAtNextBoot) {
            markDownloadedCurrentAndCurrentOutdated()
            removeOutdatedBundle()
            persistence.enqueuedReorderAtNextBoot = false
        }
        checkAssetsBundleAndManifest()
    }

    fun checkAndDownloadUpdate(success: (manifest: JSONObject, path: String) -> Unit,
                               updateUnavailable: (manifest: JSONObject) -> Unit,
                               error: (Exception?) -> Unit) {
        downloadAndVerifyManifest({ manifest ->
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
            manifestComparator.shouldReplaceBundle(currentManifest, manifestToReplace)

    fun downloadAndVerifyManifest(success: (JSONObject) -> Unit, error: (Exception?) -> Unit) {
        api.manifest({ response ->
            verifyManifest(response, success, error)
        }, error)

    }

    private fun verifyManifest(response: JSONObject, success: (JSONObject) -> Unit, error: (Exception) -> Unit) {
        manifestValidator.validate(response, {
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
        api.bundle(bundleUrl, {
            fileOperator.saveResponseToFile(bundleDir(), bundleFilename(manifest))(it, success, error)
        }, error)
    }

    private fun bundleFilename(manifest: JSONObject): String {
        return "${bundleFilePrefix()}_${manifest.optString("version")}_${System.currentTimeMillis()}"
    }

    private fun bundleFilePrefix(): String {
        return "bundle_${channelIdentifier}"
    }

    private fun bundleDir(): File {
        return fileOperator.dirPath("bundle-$id")
    }
}