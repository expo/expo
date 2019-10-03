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

    fun writeString(key: String, value: String?) {
        if(value != null) {
            sharedPreferences.edit().putString(key, value).apply()
        } else {
            sharedPreferences.edit().remove(key).apply()
        }
    }

    fun commit() {
        sharedPreferences.edit().commit();
    }

}