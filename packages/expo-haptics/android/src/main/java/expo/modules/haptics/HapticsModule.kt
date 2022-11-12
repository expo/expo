package expo.modules.haptics

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import expo.modules.haptics.arguments.HapticsImpactType
import expo.modules.haptics.arguments.HapticsInvalidArgumentException
import expo.modules.haptics.arguments.HapticsNotificationType
import expo.modules.haptics.arguments.HapticsSelectionType
import expo.modules.haptics.arguments.HapticsVibrationType
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class HapticsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val mVibrator get() = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator

  override fun definition() = ModuleDefinition {
    Name("ExpoHaptics")

    AsyncFunction("notificationAsync") { type: String, promise: Promise ->
      try {
        vibrate(HapticsNotificationType.fromString(type))
        promise.resolve(null)
      } catch (e: HapticsInvalidArgumentException) {
        throw HapticsInvalidArgumentException(e.message)
      }
    }

    AsyncFunction("selectionAsync") { promise: Promise ->
      vibrate(HapticsSelectionType)
      promise.resolve(null)
    }

    AsyncFunction("impactAsync") { style: String, promise: Promise ->
      try {
        vibrate(HapticsImpactType.fromString(style))
        promise.resolve(null)
      } catch (e: HapticsInvalidArgumentException) {
        throw HapticsInvalidArgumentException(e.message)
      }
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
