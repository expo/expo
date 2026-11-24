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
  @Volatile
  var recordingServiceBinder: AudioRecordingServiceBinder? = null
    private set
  private var bindingTimeoutJob: Job? = null

  @Volatile
  private var isRecorderReleased = false
  private var bindingContinuation: Continuation<Unit>? = null

  fun release() {
    isRecorderReleased = true
    cancelBindingTimeout()
    takeBindingContinuation()?.resumeWithException(AudioRecordingServiceException("The recorder has been released"))
  }

  fun startBindingTimeout(timeoutMs: Long = 5000) { // 5000ms is more or less the default Android system timeout for binding
    bindingTimeoutJob?.cancel()
    bindingTimeoutJob = CoroutineScope(Dispatchers.Default).launch {
      delay(timeoutMs)
      // Only the side that takes the continuation settles the binding. If a service callback
      // got it first, the binding has already been handled and must not be unbound here.
      val continuation = takeBindingContinuation() ?: return@launch
      continuation.resumeWithException(AudioRecordingServiceException("The recording service connection has failed to connect with the recording service within ${timeoutMs}ms"))
      unbind()
    }
  }

  private fun cancelBindingTimeout() {
    bindingTimeoutJob?.cancel()
    bindingTimeoutJob = null
  }

  /**
   * Returns the pending binding continuation and clears it, so that it can be resumed at most once,
   * even if the binding timeout races with a service connection callback.
   */
  private fun takeBindingContinuation(): Continuation<Unit>? = synchronized(this) {
    bindingContinuation.also { bindingContinuation = null }
  }

  private fun failBinding(exception: Exception) {
    cancelBindingTimeout()
    // `bindService` registers the connection even when it fails, so it must be unbound.
    unbind()
    takeBindingContinuation()?.resumeWithException(exception)
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
          val message = "Binding with the expo-audio recording service failed: React context lost"
          onBindingFailed(message)
          continuation.resumeWithException(AudioRecordingServiceException(message))
          return@suspendCoroutine
        }
        // `onServiceConnected` runs on the main thread and can run before `bindService` returns,
        // so the continuation must be stored before binding.
        transitionToState(ServiceBindingState.BINDING)
        synchronized(this) {
          bindingContinuation = continuation
        }
        // Without a timeout, the promise would never settle if the system never calls back.
        startBindingTimeout()

        val serviceRunning = try {
          startServiceAndBind(appContext, reactContext, this, AudioRecordingService::class.java, AudioRecordingService.ACTION_START_RECORDING)
        } catch (e: Exception) {
          failBinding(e)
          return@suspendCoroutine
        }

        if (!serviceRunning) {
          failBinding(AudioRecordingServiceException("Failed to start the recording service"))
        }
      }
    }
  }

  override fun onServiceConnected(componentName: ComponentName, binder: IBinder) {
    cancelBindingTimeout()

    val recorder = recorder.get()
    if (recorder == null || isRecorderReleased) {
      transitionToState(ServiceBindingState.FAILED)
      takeBindingContinuation()?.resumeWithException(AudioRecordingServiceException("The recorder has been deallocated"))
      return
    }

    val serviceBinder: AudioRecordingServiceBinder = binder as? AudioRecordingServiceBinder ?: run {
      takeBindingContinuation()?.resumeWithException(AudioRecordingServiceException("Could not bind to the recording service - invalid binder type"))
      transitionToState(ServiceBindingState.FAILED)
      return
    }
    recordingServiceBinder = serviceBinder
    serviceBinder.service.appContext = appContext
    transitionToState(ServiceBindingState.BOUND)

    takeBindingContinuation()?.resume(Unit)
  }

  override fun onServiceDisconnected(componentName: ComponentName) {
    cancelBindingTimeout()
    recordingServiceBinder = null
    super.onServiceDisconnected(componentName)
  }

  override fun onBindingDied(name: ComponentName?) {
    cancelBindingTimeout()
    takeBindingContinuation()?.resumeWithException(
      AudioRecordingServiceException("Service binding died")
    )
    super.onBindingDied(name)
  }

  override fun onNullBinding(componentName: ComponentName) {
    cancelBindingTimeout()
    takeBindingContinuation()?.resumeWithException(
      AudioRecordingServiceException("Service returned null binding")
    )
    super.onNullBinding(componentName)
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
