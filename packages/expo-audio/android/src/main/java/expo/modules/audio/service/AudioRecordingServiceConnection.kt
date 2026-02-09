package expo.modules.audio.service

import android.content.ComponentName
import android.os.IBinder
import expo.modules.audio.AudioRecorder
import expo.modules.audio.AudioRecordingServiceException
import expo.modules.audio.getRecordingServiceErrorMessage
import expo.modules.kotlin.AppContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference
import kotlin.coroutines.Continuation
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

class AudioRecordingServiceBinder(val service: AudioRecordingService) : android.os.Binder()

class AudioRecordingServiceConnection(
  val recorder: WeakReference<AudioRecorder>,
  appContext: AppContext
) : BaseServiceConnection<AudioRecordingServiceBinder>(appContext) {
  var recordingServiceBinder: AudioRecordingServiceBinder? = null
    private set
  private var bindingTimeoutJob: Job? = null

  @Volatile
  private var isRecorderReleased = false
  private var bindingContinuation: Continuation<Unit>? = null

  fun release() {
    isRecorderReleased = true
    cancelBindingTimeout()
  }

  fun startBindingTimeout(timeoutMs: Long = 5000) { // 5000ms is more or less the default Android system timeout for binding
    bindingTimeoutJob?.cancel()
    bindingTimeoutJob = CoroutineScope(Dispatchers.Default).launch {
      delay(timeoutMs)
      if (bindingState == ServiceBindingState.BINDING) {
        bindingContinuation?.resumeWithException(AudioRecordingServiceException("The recording service connection has failed to connect with the recording service within ${timeoutMs}ms"))
        unbind()
      }
    }
  }

  private fun cancelBindingTimeout() {
    bindingTimeoutJob?.cancel()
    bindingTimeoutJob = null
  }

  /**
   * Binds with the recording service. If the service doesn't exist, it will create the service.
   */
  suspend fun bindWithService() {
    if (bindingState == ServiceBindingState.BOUND) {
      return
    }

    if (bindingState == ServiceBindingState.BINDING) {
      throw AudioRecordingServiceException("Tried binding to the recording service while the previous attempt is still ongoing.")
    }

    if (bindingState == ServiceBindingState.UNBINDING) {
      throw AudioRecordingServiceException("Tried binding to the recording service while the unbinding process is ongoing.")
    }

    suspendCoroutine { continuation ->
      if (bindingState == ServiceBindingState.UNBOUND || bindingState == ServiceBindingState.FAILED) {
        val reactContext = appContext.reactContext ?: run {
          onBindingFailed("Binding with the expo-audio playback service failed: React context lost")
          return@suspendCoroutine
        }
        val serviceRunning = startServiceAndBind(appContext, reactContext, this, AudioRecordingService::class.java, AudioRecordingService.ACTION_START_RECORDING)

        if (!serviceRunning) {
          continuation.resumeWithException(AudioRecordingServiceException("Failed to start the recording service"))
          return@suspendCoroutine
        }

        transitionToState(ServiceBindingState.BINDING)
        bindingContinuation = continuation
      }
    }
  }

  override fun onServiceConnected(componentName: ComponentName, binder: IBinder) {
    cancelBindingTimeout()

    val recorder = recorder.get()
    if (recorder == null || isRecorderReleased) {
      transitionToState(ServiceBindingState.FAILED)
      bindingContinuation?.resumeWithException(AudioRecordingServiceException("The recorder has been deallocated"))
      return
    }

    val serviceBinder: AudioRecordingServiceBinder = binder as? AudioRecordingServiceBinder ?: run {
      bindingContinuation?.resumeWithException(AudioRecordingServiceException("Could not bind to the recording service - invalid binder type"))
      transitionToState(ServiceBindingState.FAILED)
      return
    }
    transitionToState(ServiceBindingState.BOUND)

    bindingContinuation?.resume(Unit)
    recordingServiceBinder = serviceBinder
    serviceBinder.service.appContext = appContext
  }

  override fun onServiceDisconnected(componentName: ComponentName) {
    cancelBindingTimeout()
    recordingServiceBinder = null
    super.onServiceDisconnected(componentName)
  }

  override fun onServiceDied() {
    cancelBindingTimeout()
    recordingServiceBinder = null
    super.onServiceDied()
  }

  override fun onServiceConnectedInternal(binder: AudioRecordingServiceBinder) {
    // Not used, handled in onServiceConnected above
  }

  override fun getServiceErrorMessage(message: String): String {
    return getRecordingServiceErrorMessage(message)
  }

  fun cleanup() {
    cancelBindingTimeout()
  }
}
