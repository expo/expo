package expo.modules.ota

import android.content.Context
import android.os.Bundle
import com.jakewharton.processphoenix.ProcessPhoenix
import org.json.JSONObject

import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod
import java.lang.Exception

class OtaModule(context: Context) : ExportedModule(context) {

    private var moduleRegistry: ModuleRegistry? = null
    private val manifestComparator = RevisionIdManifestCompoarator()

    override fun getName(): String {
        return NAME
    }

    override fun onCreate(moduleRegistry: ModuleRegistry) {
        this.moduleRegistry = moduleRegistry
    }

    @ExpoMethod
    fun checkForUpdateAsync(username: String, slug: String, releaseChannel: String, sdkVersion: String, promise: Promise) {
        val manifestConfig = ExpoManifestConfig(username, slug, releaseChannel, sdkVersion)
        val manifestDownloader = ManifestDownloader(manifestConfig.url, manifestConfig.headers, null)
        val persistence = ExpoOTAPersistenceFactory.INSTANCE.persistence(context, slug)
        manifestDownloader.downloadManifest(object: ManifestDownloader.ManifestDownloadCallback {
            override fun onSuccess(manifest: JSONObject) {
                val bundle = Bundle()
                bundle.putBoolean("isAvailable", manifestComparator.shouldDownloadBundle(persistence.manifest, manifest))
                bundle.putString("manifest", manifest.toString())
                promise.resolve(bundle)
            }

            override fun onError(error: Exception) {
                promise.reject(error)
            }
        })
    }

    @ExpoMethod
    fun reload() {
        ProcessPhoenix.triggerRebirth(context)
    }

    @ExpoMethod
    fun reloadFromCache() {
        reload()
    }

    @ExpoMethod
    fun fetchUpdatesAsync(username: String, slug: String, releaseChannel: String, sdkVersion: String, promise: Promise) {
        val manifestConfig = ExpoManifestConfig(username, slug, releaseChannel, sdkVersion)
        val manifestDownloader = ManifestDownloader(manifestConfig.url, manifestConfig.headers, null)
        manifestDownloader.downloadManifest(object: ManifestDownloader.ManifestDownloadCallback {
            override fun onSuccess(manifest: JSONObject) {

            }

            override fun onError(error: Exception) {
                TODO("not implemented") //To change body of created functions use File | Settings | File Templates.
            }
        })
    }

    companion object {
        private val NAME = "ExpoOta"
        private val TAG = "expo.modules.ota.OtaModule"
    }
}
