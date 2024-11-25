package expo.modules.screencapture

import android.app.Activity
import android.os.Build
import android.view.WindowManager
import androidx.annotation.RequiresApi
import java.util.function.Consumer

@RequiresApi(Build.VERSION_CODES.VANILLA_ICE_CREAM)
class ScreenRecordingEventEmitter(private val activity: Activity, private val onRecording: (Boolean) -> Unit) {
  private var isRegistered = false
  private val recordingCallback = Consumer<Int> { state ->
    val isRecording = state == WindowManager.SCREEN_RECORDING_STATE_VISIBLE
    onRecording(isRecording)
  }

  fun register() {
    if (isRegistered) {
      return
    }
    val initialState = activity.windowManager.addScreenRecordingCallback(
      activity.mainExecutor,
      recordingCallback
    )
    recordingCallback.accept(initialState)
    isRegistered = true
  }

  fun unregister() {
    if (!isRegistered) {
      return
    }
    activity.windowManager.removeScreenRecordingCallback(recordingCallback)
    isRegistered = false
  }
}