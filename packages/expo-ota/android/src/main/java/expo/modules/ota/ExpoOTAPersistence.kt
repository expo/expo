package expo.modules.ota

import android.content.Context
import org.json.JSONObject

const val KEY_BUNDLE_PATH = "bundlePath"
const val KEY_DOWNLOADED_BUNDLE_PATH = "downloadedBundlePath"
const val KEY_MANIFEST = "manifest"
const val KEY_DOWNLOADED_MANIFEST = "downloadedManifest"
const val KEY_BUNDLE_OUTDATED = "outdatedBundle"

class ExpoOTAPersistence(val context: Context, val storage: KeyValueStorage) {

    var config: ExpoOTAConfig? = null

    var bundlePath: String?
        @Synchronized get() {
            return storage.readString(KEY_BUNDLE_PATH, null)
        }
        @Synchronized set(value) {
            val recentPath = storage.readString(KEY_BUNDLE_PATH, null)
            if (value != recentPath) {
                storage.writeString(KEY_BUNDLE_PATH, value)
            }
        }

    var downloadedBundlePath: String?
        @Synchronized get() {
            return storage.readString(KEY_DOWNLOADED_BUNDLE_PATH, null)
        }
        @Synchronized set(value) {
            storage.writeString(KEY_DOWNLOADED_BUNDLE_PATH, value)
        }

    var outdatedBundlePath: String?
        @Synchronized get() {
            return storage.readString(KEY_BUNDLE_OUTDATED, null)
        }
        @Synchronized set(value) {
            storage.writeString(KEY_BUNDLE_OUTDATED, value)
        }

    var manifest: JSONObject
        @Synchronized get() {
            return JSONObject(storage.readString(KEY_MANIFEST, "{}"))
        }
        @Synchronized set(value) {
            storage.writeString(KEY_MANIFEST, value.toString())
        }

    val newestManifest: JSONObject
        @Synchronized get() {
            return if (downloadedManifest != null) downloadedManifest!! else manifest
        }

    var downloadedManifest: JSONObject?
        @Synchronized get() {
            val persisted = storage.readString(KEY_DOWNLOADED_MANIFEST, null)
            return if (persisted != null) JSONObject(persisted) else null
        }
        @Synchronized set(value) {
            storage.writeString(KEY_DOWNLOADED_MANIFEST, value?.toString())
        }


    fun makeDownloadedCurrent() {
        val downloadedManifest = downloadedManifest
        val downloadedBundle = downloadedBundlePath
        val oldOutdatedBundle = outdatedBundlePath
        if (oldOutdatedBundle != null) {
           removeFile(oldOutdatedBundle)
        }
        if (downloadedManifest != null && downloadedBundle != null) {
            outdatedBundlePath = bundlePath
            manifest = downloadedManifest
            bundlePath = downloadedBundle
            this.downloadedManifest = null
            this.downloadedBundlePath = null
        }
    }

    fun synchronize() {
        storage.commit()
    }

    @Synchronized
    fun cleanOutdated() {
        if (outdatedBundlePath != null) {
            removeFile(outdatedBundlePath!!)
            outdatedBundlePath = null
        }
    }

}

object ExpoOTAPersistenceFactory {

    private val persistenceMap = HashMap<String, ExpoOTAPersistence>()

    @Synchronized
    fun persistence(context: Context, id: String): ExpoOTAPersistence {
        return if (persistenceMap.containsKey(id)) {
            persistenceMap[id]!!
        } else {
            val persistence = ExpoOTAPersistence(context.applicationContext, KeyValueStorage(context, id))
            persistenceMap[id] = persistence
            persistence
        }
    }

}