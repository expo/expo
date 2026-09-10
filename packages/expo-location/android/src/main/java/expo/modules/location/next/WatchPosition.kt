package expo.modules.location.next

import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.location.next.locationProviders.WatchPositionParameters
import expo.modules.location.next.locationProviders.WatchSession
import expo.modules.location.next.locationProviders.WatchUpdate
import kotlin.time.Duration

@OptimizedRecord
class PositionChangedEvent(
  @Field val data: Position? = null,
  @Field val error: String? = null
) : Record

private fun WatchUpdate.toEvent(): PositionChangedEvent = when (this) {
  is WatchUpdate.Fix -> PositionChangedEvent(data = position)
  is WatchUpdate.Failure -> PositionChangedEvent(error = cause.message ?: cause.toString())
}

class PositionWatchStatus(
  @Field val isSubscribed: Boolean = false,
  @Field val canDeliverUpdates: Boolean = false,
  @Field val isHandleAlive: Boolean = false,
  @Field val isStarted: Boolean = false,
  @Field val isPaused: Boolean = false,
  @Field val isInForeground: Boolean = true
) : Record

class PausableWatchSession(
  initialParameters: WatchPositionParameters,
  private val session: WatchSession
) {

  var activeParameters: WatchPositionParameters = initialParameters
    private set
  var stagedParameters: WatchPositionParameters = initialParameters
    private set

  var isPaused: Boolean = false
  var isStarted: Boolean = false
  var isReleased: Boolean = false
  var isInForeground: Boolean = true

  private var onEvent: ((PositionChangedEvent) -> Unit)? = null

  private fun isInForegroundOrHasForegroundService(): Boolean {
    return isInForeground || LocationForegroundService.isBackgroundLocationUnthrottled()
  }

  @Synchronized
  private fun handleLocationUpdatesRequest(): Throwable? {
    val shouldBeActive = !isPaused && isStarted && !isReleased && isInForegroundOrHasForegroundService()
    val shouldRequestUpdates = !session.isSubscribed() && shouldBeActive
    val onEvent = this.onEvent
    if (shouldRequestUpdates && onEvent != null) {
      val failure = try {
        if (session.startUpdates(activeParameters) { onEvent(it.toEvent()) }) {
          null
        } else {
          PositionWatchSubscriptionException()
        }
      } catch (cause: Throwable) {
        cause
      }
      return failure
    }
    if (!shouldBeActive) {
      session.stopUpdates()
    }
    return null
  }

  private fun emitEventOnFailure(cause: Throwable?) {
    cause ?: return
    onEvent?.invoke(WatchUpdate.Failure(cause).toEvent())
  }

  @Synchronized
  fun withProfile(profile: LocationProfile) {
    stagedParameters = profile.watchParameters()
  }

  @Synchronized
  fun withInterval(interval: Duration) {
    stagedParameters = stagedParameters.copy(interval = interval)
  }

  @Synchronized
  fun restart(): Boolean {
    session.stopUpdates()
    activeParameters = stagedParameters
    return handleLocationUpdatesRequest() == null
  }

  @Synchronized
  fun onLifecycleChange(isInForeground: Boolean) {
    this.isInForeground = isInForeground
    emitEventOnFailure(handleLocationUpdatesRequest())
  }

  @Synchronized
  fun start(onEvent: (PositionChangedEvent) -> Unit) {
    isStarted = true
    this.onEvent = onEvent
    emitEventOnFailure(handleLocationUpdatesRequest())
  }

  @Synchronized
  fun stop() {
    isStarted = false
    onEvent = null
    handleLocationUpdatesRequest()
  }

  @Synchronized
  fun pause() {
    isPaused = true
    handleLocationUpdatesRequest()
  }

  @Synchronized
  fun resume(): Boolean {
    isPaused = false
    return handleLocationUpdatesRequest() == null
  }

  @Synchronized
  fun release() {
    isReleased = true
    handleLocationUpdatesRequest()
  }

  @Synchronized
  fun status(): PositionWatchStatus {
    return PositionWatchStatus(
      isSubscribed = session.isSubscribed(),
      canDeliverUpdates = session.canDeliverUpdates(),
      isHandleAlive = !isReleased,
      isStarted = isStarted,
      isPaused = isPaused,
      isInForeground = isInForeground
    )
  }
}



class PositionWatchHandle(
  val session: PausableWatchSession
) : SharedObject() {

  override fun onStartListeningToEvent(eventName: String) {
    if (eventName == POSITION_CHANGED) {
      session.start { event -> emit(POSITION_CHANGED, event) }
    }
  }

  override fun onStopListeningToEvent(eventName: String) {
    if (eventName == POSITION_CHANGED) {
      session.stop()
    }
  }

  override fun sharedObjectDidRelease() {
    session.release()
  }
}

class PositionWatchSubscriptionException : CodedException("Could not subscribe to location updates")
class PositionWatchHandleCreationException : CodedException("PositionWatchHandle cannot be created from JavaScript!")
