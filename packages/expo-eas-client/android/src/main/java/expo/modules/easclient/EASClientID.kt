package expo.modules.easclient

import android.content.Context
import java.util.UUID

private const val PREFERENCES_FILE_NAME = "dev.expo.EASSharedPreferences"
private const val EAS_CLIENT_ID_SHARED_PREFERENCES_KEY = "eas-client-id"

class EASClientID(private val context: Context) {
  companion object {
    private const val MAX_52BIT: Double = 0xFFFFFFFFFFFFF.toDouble() // 4503599627370495

    /**
     * Converts a UUID to a deterministic value in [0, 1] by interpreting
     * the first 52 bits (13 hex chars) as a fraction of the 52-bit max.
     * 52 bits is the maximum that fits exactly in a Double's mantissa.
     */
    fun uuidToInterval(uuid: UUID): Double {
      val hex = uuid.toString().replace("-", "")
      val first13 = hex.substring(0, 13)
      return first13.toLong(16).toDouble() / MAX_52BIT
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
