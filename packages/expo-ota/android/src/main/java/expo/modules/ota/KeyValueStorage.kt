package expo.modules.ota

import android.content.Context
import android.content.SharedPreferences

const val EXPO_OTA_PREFERENCES = "expo_ota"

class KeyValueStorage(val context: Context, val key: String) {

    private val sharedPreferences: SharedPreferences
        get() = context.getSharedPreferences("$EXPO_OTA_PREFERENCES-storage-$key", Context.MODE_PRIVATE)

    fun readString(key: String, defaultValue: String? = null): String? {
        return sharedPreferences.getString(key, defaultValue)
    }

    fun writeString(key: String, value: String) {
        sharedPreferences.edit().putString(key, value).commit()
    }

    fun readStringSet(key: String, defaultValue: Set<String>? = null): Set<String>? {
        return sharedPreferences.getStringSet(key, defaultValue)
    }

    fun writeStringSet(key: String, value: Set<String>) {
        sharedPreferences.edit().putStringSet(key, value).commit()
    }

    fun removeKey(key: String) {
        sharedPreferences.edit().remove(key).commit()
    }

}