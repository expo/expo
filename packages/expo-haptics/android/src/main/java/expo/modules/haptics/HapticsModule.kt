package expo.modules.haptics

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import expo.modules.haptics.arguments.HapticsImpactType
import expo.modules.haptics.arguments.HapticsNotificationType
import expo.modules.haptics.arguments.HapticsSelectionType
import expo.modules.haptics.arguments.HapticsVibrationType
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class HapticsModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()
  private val vibrator
    get() = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator

  override fun definition() = ModuleDefinition {
    Name("ExpoHaptics")

    AsyncFunction("notificationAsync") { type: String ->
      vibrate(HapticsNotificationType.fromString(type))
    }

    AsyncFunction("selectionAsync") {
      vibrate(HapticsSelectionType)
    }

    AsyncFunction("impactAsync") { style: String ->
      vibrate(HapticsImpactType.fromString(style))
    }
  }

  private fun vibrate(type: HapticsVibrationType) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      vibrator.vibrate(VibrationEffect.createWaveform(type.timings, type.amplitudes, -1))
    } else {
      vibrator.vibrate(type.oldSDKPattern, -1)
    }
  }
}
