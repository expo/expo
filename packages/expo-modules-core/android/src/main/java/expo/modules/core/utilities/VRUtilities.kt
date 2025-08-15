package expo.modules.core.utilities

import android.os.Build

class VRUtilities {
  companion object {
    const val HZOS_CAMERA_PERMISSION = "horizonos.permission.HEADSET_CAMERA"

    fun isQuest(): Boolean {
      return (Build.MANUFACTURER.equals("Oculus", ignoreCase = true) || Build.MANUFACTURER.equals("Meta", ignoreCase = true)) && Build.MODEL.contains("Quest")
    }
  }
}
