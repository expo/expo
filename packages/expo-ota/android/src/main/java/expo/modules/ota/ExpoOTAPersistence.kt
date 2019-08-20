package expo.modules.ota

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONObject

const val EXPO_OTA_PREFERENCES = "expo_ota"
const val KEY_BUNDLE_PATH = "bundlePath"
const val KEY_MANIFEST = "manifest"

class ExpoOTAPersistence(val context: Context, val identifier: String) {

    private val bundlePathKey: String = "$KEY_BUNDLE_PATH-$identifier"
    private val manifestKey: String = "$KEY_MANIFEST-$identifier"

    private val sharedPreferences: SharedPreferences
        get() = context.getSharedPreferences(EXPO_OTA_PREFERENCES, Context.MODE_PRIVATE)

    var bundlePath: String? = sharedPreferences.getString(bundlePathKey, null)
        set(value) {
            sharedPreferences.edit().putString(bundlePathKey, value).apply()
            field = value
        }

    var manifest: JSONObject = JSONObject(sharedPreferences.getString(manifestKey, "{}"))
        set(value) {
            sharedPreferences.edit().putString(manifestKey, value.toString()).apply()
            field = value
        }


}