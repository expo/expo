package expo.modules.ota

import android.content.Context
import android.text.TextUtils
import org.json.JSONObject

const val KEY_BUNDLE_PATH = "bundlePath"
const val KEY_DOWNLOADED_BUNDLE_PATH = "downloadedBundlePath"
const val KEY_MANIFEST = "manifest"
const val KEY_DOWNLOADED_MANIFEST = "downloadedManifest"
const val KEY_BUNDLE_OUTDATED = "outdatedBundle"
const val KEY_REORDER_ENQUEUED = "reorderAtBoot"

class ExpoOTAPersistence(val storage: KeyValueStorage) {

    var config: ExpoOTAConfig? = null
    var id: String? = null

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
            var manifestString = storage.readString(KEY_MANIFEST, "{}")
            if(TextUtils.isEmpty(manifestString)) manifestString = "{}"
            return JSONObject(manifestString)
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

    var enqueuedReorderAtNextBoot: Boolean
        @Synchronized get() {
            return storage.readBoolean(KEY_REORDER_ENQUEUED, false)
        }
        @Synchronized set(value) {
            storage.writeBoolean(KEY_REORDER_ENQUEUED, value)
        }


    fun markDownloadedCurrentAndCurrentOutdated() {
        val downloadedManifest = downloadedManifest
        val downloadedBundle = downloadedBundlePath
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

}

object ExpoOTAPersistenceFactory {

    private val persistenceMap = HashMap<String, ExpoOTAPersistence>()

    @Synchronized
    fun persistence(context: Context, id: String?, createIfNeeded: Boolean): ExpoOTAPersistence? {
        return if(id == null) {
            if(persistenceMap.size == 1) {
                persistenceMap[persistenceMap.keys.first()]!!
            } else {
                return null
            }
        } else if (persistenceMap.containsKey(id)) {
            persistenceMap[id]!!
        } else if(createIfNeeded) {
            val persistence = ExpoOTAPersistence(SharedPreferencesKeyValueStorage(context, id))
            persistenceMap[id] = persistence
            persistence
        } else {
            null
        }
    }

}