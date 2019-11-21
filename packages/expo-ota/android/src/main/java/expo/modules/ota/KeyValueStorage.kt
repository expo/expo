package expo.modules.ota

import android.annotation.SuppressLint
import android.content.Context
import android.content.SharedPreferences

const val EXPO_OTA_PREFERENCES = "expo_ota"

interface KeyValueStorage {

    fun readString(key: String, defaultValue: String? = null): String?

    fun writeString(key: String, value: String?)

    fun commit()

    fun readBoolean(key: String, default: Boolean = false): Boolean

    fun writeBoolean(key: String, value: Boolean)

}

class SharedPreferencesKeyValueStorage(val context: Context, val key: String): KeyValueStorage {

    private val sharedPreferences: SharedPreferences
        get() = context.getSharedPreferences("$EXPO_OTA_PREFERENCES-storage-$key", Context.MODE_PRIVATE)

    override fun readString(key: String, defaultValue: String?): String? {
        return sharedPreferences.getString(key, defaultValue)
    }

    override fun writeString(key: String, value: String?) {
        if(value != null) {
            sharedPreferences.edit().putString(key, value).apply()
        } else {
            sharedPreferences.edit().remove(key).apply()
        }
    }

    @SuppressLint("ApplySharedPref")
    override fun commit() {
        sharedPreferences.edit().commit()
    }

    override fun readBoolean(key: String, default: Boolean): Boolean {
        return sharedPreferences.getBoolean(key, default)
    }

    override fun writeBoolean(key: String, value: Boolean) {
        sharedPreferences.edit().putBoolean(key, value).apply()
    }

}