package expo.modules.kotlin.activityresult

import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import android.os.Parcel
import android.util.Base64
import androidx.core.os.bundleOf
import java.io.Serializable
import java.util.*
import kotlin.collections.ArrayList
import kotlin.collections.HashMap

const val EXPIRE_KEY = "expire"
const val EXPIRATION_TIME = 5 * 60 * 1000 // 5 min

/**
 * This class serves as a persistable store that accepts different kinds of data that have to
 * be preserved between Activity destruction and recreation.
 * For each kind of data there's a separate pair of methods.
 * Ideally we would use [android.app.Activity.onSaveInstanceState] and [android.app.Activity.onCreate]
 * alongside with `savedBundleState`, but it's blocked by https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067
 */
class DataPersistor(context: Context) {
  private val sharedPreferences: SharedPreferences = context.getSharedPreferences("expo.modules.kotlin.PersistentDataManager", Context.MODE_PRIVATE)

  private val accumulator = Bundle()

  @Suppress("PropertyName")
  private var _retrievedData: Bundle? = null
  private val retrievedData: Bundle
    get() = _retrievedData ?: retrieveData().also { _retrievedData = it }

  fun addStringArrayList(key: String, value: ArrayList<String>): DataPersistor {
    accumulator.putStringArrayList(key, value)
    return this
  }

  fun retrieveStringArrayList(key: String): java.util.ArrayList<String>? {
    return retrievedData.getStringArrayList(key)
  }

  fun addStringToIntMap(key: String, value: Map<String, Int>): DataPersistor {
    accumulator.putBundle(key, bundleOf(*value.toList().toTypedArray()))
    return this
  }

  fun retrieveStringToIntMap(key: String): Map<String, Int>? {
    return retrievedData.getBundle(key)?.let { bundle ->
      val keys = bundle.keySet()
      keys.associateWith { bundle.getInt(it) }
    }
  }

  fun addStringToSerializableMap(key: String, value: Map<String, Serializable>): DataPersistor {
    accumulator.putBundle(
      key,
      bundleOf(
        *value
          .toList()
          .toTypedArray()
      )
    )
    return this
  }

  fun retrieveStringToSerializableMap(key: String): Map<String, Serializable>? {
    return retrievedData.getBundle(key)
      ?.let { bundle ->
        bundle
          .keySet()
          .associateWith { key ->
            bundle.getSerializable(key) ?: throw IllegalStateException("For a key '$key' there should be a serializable class available")
          }
      }
  }

  fun addBundle(key: String, value: Bundle): DataPersistor {
    accumulator.putBundle(key, value)
    return this
  }

  fun retrieveBundle(key: String): Bundle? {
    return retrievedData.getBundle(key)
  }

  fun addSerializable(key: String, value: Serializable): DataPersistor {
    accumulator.putSerializable(key, value)
    return this
  }

  fun retrieveSerializable(key: String): Serializable? {
    return retrievedData.getSerializable(key)
  }

  fun persist() {
    val editor = sharedPreferences.edit()

    editor.putString("bundle", accumulator.toBase64())
    editor.putLong(EXPIRE_KEY, Date().time + EXPIRATION_TIME)

    editor.commit()
  }

  private fun retrieveData(): Bundle {
    var result = Bundle()
    val expirationTime = sharedPreferences.getLong(EXPIRE_KEY, 0)
    if (expirationTime > Date().time) {
      val stringResult = sharedPreferences.getString("bundle", null)
      result = stringResult?.toBundle() ?: result
    }

    sharedPreferences
      .edit()
      .clear()
      .apply()

    return result
  }
}

private fun String.toBundle(): Bundle? {
  val bytes = Base64.decode(this, 0)
  return Parcel.obtain().run {
    unmarshall(bytes, 0, bytes.size)
    setDataPosition(0)
    val bundle = readBundle(null)
    recycle()
    bundle
  }
}

private fun Bundle.toBase64(): String {
  val bytes = Parcel.obtain().run {
    writeBundle(this@toBase64)
    val bytes = marshall()
    recycle()
    bytes
  }
  return Base64.encodeToString(bytes, 0)
}
