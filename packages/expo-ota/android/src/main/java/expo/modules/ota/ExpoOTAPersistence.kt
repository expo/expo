package expo.modules.ota

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject

const val EXPO_OTA_PREFERENCES = "expo_ota"
const val KEY_BUNDLE_PATH = "bundlePath"
const val KEY_MANIFEST = "manifest"

class ExpoOTAPersistence(val context: Context, val id: String) {

    private val bundlePathKey: String = "$KEY_BUNDLE_PATH-$id"
    private val manifestKey: String = "$KEY_MANIFEST-$id"

    var config: ExpoOTAConfig? = null

    private val sharedPreferences: SharedPreferences
        get() = context.getSharedPreferences(EXPO_OTA_PREFERENCES, Context.MODE_PRIVATE)

    var bundlePath: String?
        @Synchronized get() {
            return sharedPreferences.getString(bundlePathKey, null)
        }
        @Synchronized set(value) {
            sharedPreferences.edit().putString(bundlePathKey, value).apply()
        }

    var manifest: JSONObject
        @Synchronized get() {
            return JSONObject(sharedPreferences.getString(manifestKey, "{}"))
        }
        @Synchronized set(value) {
            sharedPreferences.edit().putString(manifestKey, value.toString()).apply()
        }

}

enum class ExpoOTAPersistenceFactory {
    INSTANCE;

    private val persistencesMap = HashMap<String, ExpoOTAPersistence>()

    @Synchronized fun persistence(context: Context, id: String): ExpoOTAPersistence {
        return if(persistencesMap.containsKey(id)) {
            persistencesMap[id]!!
        } else {
            val persistence = ExpoOTAPersistence(context.applicationContext, id)
            persistencesMap[id] = persistence
            persistence
        }
    }

}