package expo.modules.imagepicker

import android.content.Context
import android.content.SharedPreferences
import android.net.Uri
import android.os.Bundle
import android.os.Parcel
import android.util.Base64
import java.io.File
import java.util.*
import kotlin.collections.ArrayList

const val SHARED_PREFERENCES_NAME = "expo.modules.imagepicker.PickerResultsStore"
const val EXPIRE_KEY = "expire"
const val EXPIRATION_TIME = 5 * 60 * 1000 // 5 min

/**
 * Class that represents a temporary store to promise's results.
 * It's used if the android kills current activity and we can't resolve promise immediately.
 */
class PickerResultsStore(context: Context) {
  private val sharedPreferences: SharedPreferences =
    context.getSharedPreferences(SHARED_PREFERENCES_NAME, Context.MODE_PRIVATE)

  fun addPendingResult(bundle: Bundle) {
    bundle.putLong(EXPIRE_KEY, Date().time + EXPIRATION_TIME)

    val uuid = UUID.randomUUID().toString()
    val encodedBundle = Base64.encodeToString(bundleToBytes(bundle), 0)

    sharedPreferences.edit()
      .putString(uuid, encodedBundle)
      .apply()
  }

  fun getAllPendingResults(): List<Bundle> {
    val result = ArrayList<Bundle>()
    val now = Date().time
    for ((_, value) in sharedPreferences.all) {
      if (value is String) {
        bytesToBundle(Base64.decode(value, 0))?.let { decodedBundle ->
          // The picked file is in the cache folder, so the android could delete it.
          if (decodedBundle.containsKey("uri")
            && !File(Uri.parse(decodedBundle.getString("uri")).path!!).exists()) {
            return@let
          }

          if (decodedBundle.getLong(EXPIRE_KEY) < now) {
            return@let
          }

          decodedBundle.remove(EXPIRE_KEY)
          result.add(decodedBundle)
        }
      }
    }

    sharedPreferences
      .edit()
      .clear()
      .apply()

    return result
  }

  private fun bundleToBytes(bundle: Bundle) = Parcel.obtain().run {
    writeBundle(bundle)
    val bytes = marshall()
    recycle()
    bytes
  }


  private fun bytesToBundle(bytes: ByteArray) = Parcel.obtain().run {
    unmarshall(bytes, 0, bytes.size)
    setDataPosition(0)
    val bundle = readBundle(PickerResultsStore::class.java.classLoader)
    recycle()
    bundle
  }
}
