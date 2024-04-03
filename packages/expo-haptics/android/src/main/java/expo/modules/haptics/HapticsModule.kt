package expo.modules.haptics

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
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
  private val vibrator: Vibrator
    get() = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }

  override fun definition() = ModuleDefinition {
    Name("ExpoHaptics")

    AsyncFunction("notificationAsync") { type: String ->
      vibrate(HapticsNotificationType.fromString(type))
    }

    AsyncFunction<Unit>("selectionAsync") {
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
      @Suppress("DEPRECATION")
      vibrator.vibrate(type.oldSDKPattern, -1)
    }
  }
}
