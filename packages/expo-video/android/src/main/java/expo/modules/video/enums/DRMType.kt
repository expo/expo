package expo.modules.video.enums

import androidx.media3.common.C
import expo.modules.kotlin.types.Enumerable
import expo.modules.video.UnsupportedDRMTypeException
import java.util.UUID

enum class DRMType(val value: String) : Enumerable {
  CLEARKEY("clearkey"),
  FAIRPLAY("fairplay"),
  PLAYREADY("playready"),
  WIDEVINE("widevine");

  fun isSupported(): Boolean {
    return this != FAIRPLAY
  }

  fun toUUID(): UUID {
    return when (this) {
      CLEARKEY -> C.CLEARKEY_UUID
      FAIRPLAY -> throw UnsupportedDRMTypeException(this)
      PLAYREADY -> C.PLAYREADY_UUID
      WIDEVINE -> C.WIDEVINE_UUID
    }
  }
}
