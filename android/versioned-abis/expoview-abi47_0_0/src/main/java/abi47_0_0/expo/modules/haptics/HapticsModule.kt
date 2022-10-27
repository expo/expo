package abi47_0_0.expo.modules.haptics

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import abi47_0_0.expo.modules.core.ExportedModule
import abi47_0_0.expo.modules.core.Promise
import abi47_0_0.expo.modules.core.interfaces.ExpoMethod
import abi47_0_0.expo.modules.haptics.arguments.HapticsInvalidArgumentException
import abi47_0_0.expo.modules.haptics.arguments.HapticsImpactType
import abi47_0_0.expo.modules.haptics.arguments.HapticsNotificationType
import abi47_0_0.expo.modules.haptics.arguments.HapticsSelectionType
import abi47_0_0.expo.modules.haptics.arguments.HapticsVibrationType

class HapticsModule internal constructor(context: Context) : ExportedModule(context) {
  private val mVibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
  override fun getName() = "ExpoHaptics"

  @ExpoMethod
  fun notificationAsync(type: String, promise: Promise) {
    try {
      vibrate(HapticsNotificationType.fromString(type))
      promise.resolve(null)
    } catch (e: HapticsInvalidArgumentException) {
      promise.reject(e)
    }
  }

  @ExpoMethod
  fun selectionAsync(promise: Promise) {
    vibrate(HapticsSelectionType)
    promise.resolve(null)
  }

  @ExpoMethod
  fun impactAsync(style: String, promise: Promise) {
    try {
      vibrate(HapticsImpactType.fromString(style))
      promise.resolve(null)
    } catch (e: HapticsInvalidArgumentException) {
      promise.reject(e)
    }
  }

  private fun vibrate(type: HapticsVibrationType) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      mVibrator.vibrate(VibrationEffect.createWaveform(type.timings, type.amplitudes, -1))
    } else {
      mVibrator.vibrate(type.oldSDKPattern, -1)
    }
  }
}
