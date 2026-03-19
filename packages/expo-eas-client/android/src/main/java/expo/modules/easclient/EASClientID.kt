package expo.modules.easclient

import android.content.Context
import java.util.UUID

private const val PREFERENCES_FILE_NAME = "dev.expo.EASSharedPreferences"
private const val EAS_CLIENT_ID_SHARED_PREFERENCES_KEY = "eas-client-id"

class EASClientID(private val context: Context) {
  companion object {
    /**
     * Converts a UUID to a deterministic value in [0, 1] by hashing its raw bytes
     * with SHA-256 and interpreting the first 8 bytes as a UInt64 fraction.
     */
    fun uuidToInterval(uuid: UUID): Double {
      val buffer = java.nio.ByteBuffer.allocate(16)
      buffer.putLong(uuid.mostSignificantBits)
      buffer.putLong(uuid.leastSignificantBits)
      val digest = java.security.MessageDigest.getInstance("SHA-256")
      val hash = digest.digest(buffer.array())
      val value = java.nio.ByteBuffer.wrap(hash, 0, 8).getLong()
      return value.toULong().toDouble() / ULong.MAX_VALUE.toDouble()
    }
  }

  val uuid: UUID by lazy {
    val sharedPreferences = context.getSharedPreferences(PREFERENCES_FILE_NAME, Context.MODE_PRIVATE)
    var clientId = sharedPreferences.getString(EAS_CLIENT_ID_SHARED_PREFERENCES_KEY, null)
    if (clientId == null) {
      clientId = UUID.randomUUID().toString()
      with(sharedPreferences.edit()) {
        putString(EAS_CLIENT_ID_SHARED_PREFERENCES_KEY, clientId)
        apply()
      }
    }
    UUID.fromString(clientId)
  }
}
