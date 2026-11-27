package expo.modules.location.next

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.toCodedException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.location.next.locationProviders.UpdatesSession

@OptimizedRecord
class WatchError(
  @Field val code: String,
  @Field val message: String
) : Record

@OptimizedRecord
class WatchEvent(
  @Field val data: Record? = null,
  @Field val error: WatchError? = null
) : Record

internal fun Throwable.toWatchEvent(): WatchEvent = toCodedException().let {
  WatchEvent(error = WatchError(code = it.code, message = it.message ?: it.toString()))
}

class WatchStatus(
  @Field val isSubscribed: Boolean = false,
  @Field val canDeliverUpdates: Boolean = false,
  @Field val isHandleAlive: Boolean = false,
  @Field val isStarted: Boolean = false,
  @Field val isPaused: Boolean = false,
  @Field val areUpdatesAllowed: Boolean = true,
  @Field val isInForeground: Boolean = true
) : Record

class PausableWatchSession<Parameters>(
  initialParameters: Parameters,
  private val source: UpdatesSession<Parameters>,
  private var areUpdatesAllowed: Boolean
) {

  private var activeParameters: Parameters = initialParameters
  private var stagedParameters: Parameters = initialParameters

  var isPaused: Boolean = false
  var isStarted: Boolean = false
  var isReleased: Boolean = false

  private var onEvent: ((WatchEvent) -> Unit)? = null

  @Synchronized
  private fun handleUpdatesRequest(): Throwable? {
    val shouldBeActive = !isPaused && isStarted && !isReleased && areUpdatesAllowed
    val shouldRequestUpdates = !source.isSubscribed() && shouldBeActive
    val onEvent = this.onEvent
    if (shouldRequestUpdates && onEvent != null) {
      return try {
        source.startUpdates(activeParameters, onEvent)
        null
      } catch (cause: Throwable) {
        cause
      }
    }
    if (!shouldBeActive) {
      source.stopUpdates()
    }
    return null
  }

  private fun emitEventOnFailure(cause: Throwable?) {
    cause ?: return
    onEvent?.invoke(cause.toWatchEvent())
  }

  @Synchronized
  fun stage(transform: (Parameters) -> Parameters) {
    stagedParameters = transform(stagedParameters)
  }

  @Synchronized
  fun restart(): Boolean {
    source.stopUpdates()
    activeParameters = stagedParameters
    return handleUpdatesRequest() == null
  }

  @Synchronized
  fun setUpdatesAllowed(allowed: Boolean) {
    this.areUpdatesAllowed = allowed
    emitEventOnFailure(handleUpdatesRequest())
  }

  @Synchronized
  fun start(onEvent: (WatchEvent) -> Unit) {
    isStarted = true
    this.onEvent = onEvent
    emitEventOnFailure(handleUpdatesRequest())
  }

  @Synchronized
  fun stop() {
    isStarted = false
    onEvent = null
    handleUpdatesRequest()
  }

  @Synchronized
  fun pause() {
    isPaused = true
    handleUpdatesRequest()
  }

  @Synchronized
  fun resume(): Boolean {
    isPaused = false
    return handleUpdatesRequest() == null
  }

  @Synchronized
  fun release() {
    isReleased = true
    handleUpdatesRequest()
  }

  @Synchronized
  fun status(isInForeground: Boolean): WatchStatus {
    return WatchStatus(
      isSubscribed = source.isSubscribed(),
      canDeliverUpdates = source.canDeliverUpdates(),
      isHandleAlive = !isReleased,
      isStarted = isStarted,
      isPaused = isPaused,
      areUpdatesAllowed = areUpdatesAllowed,
      isInForeground = isInForeground
    )
  }
}

abstract class WatchHandle(private val eventName: String) : SharedObject() {
  abstract val session: PausableWatchSession<*>

  override fun onStartListeningToEvent(eventName: String) {
    if (eventName == this.eventName) {
      session.start { event -> emit(this.eventName, event) }
    }
  }

  override fun onStopListeningToEvent(eventName: String) {
    if (eventName == this.eventName) {
      session.stop()
    }
  }

  override fun sharedObjectDidRelease() {
    session.release()
  }
}

class WatchHandleCreationException(name: String) : CodedException("$name cannot be created from JavaScript")
