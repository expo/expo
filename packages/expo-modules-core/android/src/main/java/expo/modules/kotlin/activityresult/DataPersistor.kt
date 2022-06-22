package expo.modules.kotlin.activityresult

import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import java.io.Serializable
import java.util.*
import kotlin.collections.ArrayList
import kotlin.collections.HashMap

/**
 * This class serves as a persistable store that accepts different kinds of data that have to pe persistent
 * between Activity destruction adn recreation.
 * Ideally we would use [android.app.Activity.onSaveInstanceState] and [android.app.Activity.onCreate]
 * alongside with `savedBundleState`, but it's blocked by https://github.com/software-mansion/react-native-screens/issues/17#issuecomment-424704067
 */
class DataPersistor(context: Context) {
  val sharedPreferences: SharedPreferences = context.getSharedPreferences("expo.modules.kotlin.PersistentDataManager", Context.MODE_PRIVATE)
  val accumulator = Bundle()

  fun addStringArrayList(key: String, value: ArrayList<String>): DataPersistor {
    accumulator.putStringArrayList(key, value)
    return this
  }

  fun addStringToIntMap(key: String, value: Map<String, Int>): DataPersistor {
//    TODO()
    return this
  }

  fun addStringToBundleableMap(key: String, value: Map<String, Any>): DataPersistor {
//    TODO("Not yet implemented")
    return this
  }

  fun addBundle(key: String, value: Bundle): DataPersistor {
//    TODO("Not yet implemented")
    return this
  }

  fun addSerializable(key: String, value: Serializable): DataPersistor {
//    TODO("Not yet implemented")
    return this
  }

  fun persist() {
    val editor = sharedPreferences.edit()

    editor.apply()
  }

  private fun retrieveData() {
    sharedPreferences
      .edit()
      .clear()
      .apply()
  }

  fun retrieveStringArrayList(key: String): java.util.ArrayList<String> {
    // TODO("Not yet implemented")
    return ArrayList()
  }

  fun retrieveStringToIntMap(key: String): Map<String, Int> {
    // TODO("Not yet implemented")
    return HashMap()
  }

  fun retrieveStringToBundleableMap(key: String): Map<String, Bundleable<*>> {
//    TODO("Not yet implemented")
    return HashMap()
  }

  fun retrieveBundle(key: String): Bundle {
//    TODO("Not yet implemented")
    return Bundle()
  }

  fun retrieveSerializable(key: String): Serializable {
//    TODO("Not yet implemented")
    return Random()
  }
}

