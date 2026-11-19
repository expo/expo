package expo.modules.easclient

import android.content.Context
import java.util.UUID

private const val PREFERENCES_FILE_NAME = "dev.expo.EASSharedPreferences"
private const val EAS_CLIENT_ID_SHARED_PREFERENCES_KEY = "eas-client-id"

class EASClientID(private val context: Context) {
  companion object {
    /**
     * Converts a UUID to a deterministic value in [0, 1).
     */
    fun deterministicUniformValue(uuid: UUID): Double {
      // Byte 8 is the RFC 4122 variant octet, pinned to `10`, and it is the high byte of
      // leastSignificantBits, so that half alone only spans [0.5, 0.75]. splitmix64 over both
      // halves moves the fixed bits off the high end; 2^53 is the widest exact Double range.
      var z = (uuid.mostSignificantBits xor uuid.leastSignificantBits).toULong()
      z = (z xor (z shr 30)) * 0xbf58476d1ce4e5b9UL
      z = (z xor (z shr 27)) * 0x94d049bb133111ebUL
      z = z xor (z shr 31)
      return (z shr 11).toDouble() / (1L shl 53).toDouble()
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
