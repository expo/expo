package expo.modules.haptics

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.View
import expo.modules.haptics.arguments.HapticType
import expo.modules.haptics.arguments.ImpactStyle
import expo.modules.haptics.arguments.NotificationType
import expo.modules.haptics.arguments.SelectionType
import expo.modules.haptics.arguments.VibrationType
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.currentActivity
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@ExpoModule("ExpoHaptics")
class HapticsModule : Module() {
  private val vibrator: Vibrator
    get() = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      (androidContext.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager).defaultVibrator
    } else {
      @Suppress("DEPRECATION")
      androidContext.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
    }

  @JS
  suspend fun notificationAsync(type: NotificationType): Unit = vibrate(type.vibration)

  @JS
  suspend fun impactAsync(style: ImpactStyle): Unit = vibrate(style.vibration)


  @JS
  suspend fun selectionAsync(): Unit = vibrate(SelectionType)

  @JS
  suspend fun performHapticsAsync(type: HapticType): Unit = withContext(Dispatchers.Main) {
    currentActivity
      ?.findViewById<View>(android.R.id.content)
      ?.performHapticFeedback(type.toHapticFeedbackType())
  }

  private suspend fun vibrate(type: VibrationType): Unit = withContext(Dispatchers.IO) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      vibrator.vibrate(VibrationEffect.createWaveform(type.timings, type.amplitudes, -1))
    } else {
      @Suppress("DEPRECATION")
      vibrator.vibrate(type.oldSDKPattern, -1)
    }
  }
}
