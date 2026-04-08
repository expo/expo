package expo.modules.easclient

import android.content.Context
import java.util.UUID

private const val PREFERENCES_FILE_NAME = "dev.expo.EASSharedPreferences"
private const val EAS_CLIENT_ID_SHARED_PREFERENCES_KEY = "eas-client-id"

class EASClientID(private val context: Context) {
  companion object {
    /**
     * Converts a UUID to a deterministic value in [0, 1] using the least significant
     * 64 bits interpreted as an unsigned integer fraction of ULong.MAX_VALUE.
     */
    fun deterministicUniformValue(uuid: UUID): Double {
      return uuid.leastSignificantBits.toULong().toDouble() / ULong.MAX_VALUE.toDouble()
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
