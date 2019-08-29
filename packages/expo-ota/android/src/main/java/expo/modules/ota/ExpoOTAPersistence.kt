package expo.modules.ota

import android.content.Context
import org.json.JSONObject
import java.util.*
import kotlin.collections.HashMap

const val KEY_BUNDLE_PATH = "bundlePath"
const val KEY_DOWNLOADED_BUNDLE_PATH = "downloadedBundlePath"
const val KEY_EXPIRED_BUNDLES_PATH = "expiredBundlesPath"
const val KEY_MANIFEST = "manifest"
const val KEY_DOWNLOADED_MANIFEST = "downloadedManifest"

class ExpoOTAPersistence(val context: Context, val storage: KeyValueStorage) {

    var config: ExpoOTAConfig? = null

    var bundlePath: String?
        @Synchronized get() {
            return storage.readString(KEY_BUNDLE_PATH, null)
        }
        @Synchronized set(value) {
            val recentPath = storage.readString(KEY_BUNDLE_PATH, null)
            if (value != recentPath) {
                if(value != null) {
                    storage.writeString(KEY_BUNDLE_PATH, value)
                    if (recentPath != null) {
                        addExpiredBundlesPath(recentPath)
                    }
                }
            }
        }

    var downloadedBundlePath: String?
        @Synchronized get() {
            return storage.readString(KEY_DOWNLOADED_BUNDLE_PATH, null)
        }
        @Synchronized set(value) {
            val recentPath = storage.readString(KEY_DOWNLOADED_BUNDLE_PATH, null)
            if (value != recentPath) {
                if(value != null) {
                    storage.writeString(KEY_DOWNLOADED_BUNDLE_PATH, value)
                    if (recentPath != null) {
                        addExpiredBundlesPath(recentPath)
                    }
                }
            }
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
            storage.writeString(KEY_DOWNLOADED_MANIFEST, value.toString())
        }

    val expiredBundlesPaths: Set<String>
        @Synchronized get() {
            return storage.readStringSet(KEY_EXPIRED_BUNDLES_PATH, Collections.emptySet())!!
        }

    fun makeDownloadedCurrent() {
        val downloaded = downloadedBundlePath
        bundlePath = downloaded
        storage.removeKey(KEY_DOWNLOADED_BUNDLE_PATH)

        val downloadedManifest = downloadedManifest
        if (downloadedManifest != null) {
            manifest = downloadedManifest
        }
        storage.removeKey(KEY_DOWNLOADED_MANIFEST)
    }

    @Synchronized
    fun addExpiredBundlesPath(path: String) {
        storage.writeStringSet(KEY_EXPIRED_BUNDLES_PATH, expiredBundlesPaths.plus(path))
    }

    @Synchronized
    fun replaceExpiredBundles(set: Set<String>) {
        storage.writeStringSet(KEY_EXPIRED_BUNDLES_PATH, set)
    }

}

enum class ExpoOTAPersistenceFactory {
    INSTANCE;

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