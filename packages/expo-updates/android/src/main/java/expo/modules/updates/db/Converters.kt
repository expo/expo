package expo.modules.updates.db

import android.net.Uri
import android.util.Log
import androidx.room.TypeConverter
import expo.modules.updates.db.enums.HashType
import expo.modules.updates.db.enums.UpdateStatus
import org.json.JSONException
import org.json.JSONObject
import java.nio.ByteBuffer
import java.util.*

class Converters {
  private val TAG = Converters::class.java.simpleName

  @TypeConverter
  fun longToDate(value: Long?): Date? {
    return if (value == null) null else Date(value)
  }

  @TypeConverter
  fun dateToLong(date: Date?): Long? {
    return date?.time
  }

  @TypeConverter
  fun stringToUri(string: String?): Uri? {
    return if (string == null) null else Uri.parse(string)
  }

  @TypeConverter
  fun uriToString(uri: Uri?): String? {
    return uri?.toString()
  }

  @TypeConverter
  fun stringToJsonObject(string: String?): JSONObject? {
    if (string == null) {
      return null
    }
    return try {
      JSONObject(string)
    } catch (e: JSONException) {
      Log.e(TAG, "Could not convert string to JSONObject", e)
      JSONObject()
    }
  }

  @TypeConverter
  fun jsonObjectToString(jsonObject: JSONObject?): String? {
    return jsonObject?.toString()
  }

  @TypeConverter
  fun bytesToUuid(bytes: ByteArray?): UUID {
    val bb = ByteBuffer.wrap(bytes)
    val firstLong = bb.long
    val secondLong = bb.long
    return UUID(firstLong, secondLong)
  }

  @TypeConverter
  fun uuidToBytes(uuid: UUID): ByteArray {
    val bb = ByteBuffer.wrap(ByteArray(16))
    bb.putLong(uuid.mostSignificantBits)
    bb.putLong(uuid.leastSignificantBits)
    return bb.array()
  }

  /**
   * It's important that the integer values here stay constant across all versions of this library
   * since they are stored in SQLite on user devices. (The nonconsecutive numbers are a historical
   * artifact.)
   */
  @TypeConverter
  fun intToStatus(value: Int): UpdateStatus {
    return when (value) {
      1 -> UpdateStatus.READY
      3 -> UpdateStatus.PENDING
      5 -> UpdateStatus.EMBEDDED
      6 -> UpdateStatus.DEVELOPMENT
      else -> throw AssertionError("Invalid UpdateStatus value in database: $value")
    }
  }

  @TypeConverter
  fun statusToInt(status: UpdateStatus?): Int {
    return when (status) {
      UpdateStatus.READY -> 1
      UpdateStatus.PENDING -> 3
      UpdateStatus.EMBEDDED -> 5
      UpdateStatus.DEVELOPMENT -> 6
      else -> throw AssertionError("Invalid UpdateStatus value: $status")
    }
  }

  @TypeConverter
  fun intToHashType(value: Int): HashType {
    return HashType.SHA256 // only one hash type for now, SHA256 = 0
  }

  @TypeConverter
  fun hashTypeToInt(hashType: HashType?): Int {
    return 0 // only one hash type for now, SHA256 = 0
  }

  @TypeConverter
  fun stringToStringStringMap(value: String?): Map<String, String>? =
    value?.let { jsonText ->
      JSONObject(jsonText).let { json ->
        buildMap {
          val keys = json.keys()
          while (keys.hasNext()) {
            val key = keys.next()
            put(key, json.optString(key))
          }
        }
      }
    }

  @TypeConverter
  fun stringStringMapToString(value: Map<String, String>?): String? =
    value?.let { map ->
      JSONObject().apply {
        map.forEach { (k, v) -> put(k, v) }
      }.toString()
    }
}
