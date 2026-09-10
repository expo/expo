package expo.modules.location.next

import android.annotation.SuppressLint
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.location.next.locationProviders.WatchPositionParameters
import expo.modules.location.next.locationProviders.WatchSession
import kotlin.time.Duration

class WatchParametersStatus(
  @Field val priority: String = "",
  @Field val intervalSeconds: Double = 0.0,
  @Field val maxUpdateDelaySeconds: Double = 0.0
) : Record

class PositionChangedEvent(
  @Field val data: Position? = null,
  @Field val error: String? = null
) : Record

class PositionWatchStatus(
  @Field val isWatching: Boolean = false,
  @Field val isPaused: Boolean = false,
  @Field val isSubscribed: Boolean = false,
  @Field val activeParameters: WatchParametersStatus = WatchParametersStatus(),
  @Field val stagedParameters: WatchParametersStatus = WatchParametersStatus()
) : Record

fun WatchPositionParameters.toStatus(): WatchParametersStatus {
  return WatchParametersStatus(
    priority = priority.name,
    intervalSeconds = interval.inWholeMilliseconds / 1000.0,
    maxUpdateDelaySeconds = maxUpdateDelay.inWholeMilliseconds / 1000.0
  )
}

class PausableWatchSession(
  initialParameters: WatchPositionParameters,
  private val session: WatchSession
) {

  var activeParameters: WatchPositionParameters = initialParameters
    private set
  var stagedParameters: WatchPositionParameters = initialParameters
    private set

  @Volatile
  var lastPosition: Position? = null

  var isPaused: Boolean = false
  var isStarted: Boolean = false
  var isReleased: Boolean = false
  var isSubscribed: Boolean = false
  var isInForeground: Boolean = true

  private var onPosition: ((Position) -> Unit)? = null

  private fun isInForegroundOrHasForegroundService(): Boolean {
    return isInForeground || LocationForegroundService.isBackgroundLocationUnthrottled()
  }

  @SuppressLint("MissingPermission")
  @Synchronized
  private fun handleLocationUpdatesRequest(): Boolean {
    val shouldRequestUpdates = !isSubscribed && !isPaused && isStarted && !isReleased && isInForegroundOrHasForegroundService()
    val shouldRemoveRequest = isSubscribed && (isPaused || !isStarted || isReleased || !isInForegroundOrHasForegroundService())
    val onPosition = this.onPosition
    if (shouldRequestUpdates && onPosition != null) {
      isSubscribed = session.startUpdates(activeParameters, onPosition)
      return isSubscribed
    }
    if (shouldRemoveRequest) {
      session.stopUpdates()
      isSubscribed = false
    }
    return true
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
  fun withBatching(maxUpdateDelay: Duration) {
    stagedParameters = stagedParameters.copy(maxUpdateDelay = maxUpdateDelay)
  }

  @Synchronized
  fun restart(): Boolean {
    val needsResubscribe = !isSubscribed && isStarted && !isPaused && !isReleased && isInForegroundOrHasForegroundService()
    if (stagedParameters == activeParameters && !needsResubscribe) {
      return true
    }
    activeParameters = stagedParameters
    val onPosition = this.onPosition
    if (isSubscribed && onPosition != null) {
      session.stopUpdates()
      isSubscribed = session.startUpdates(activeParameters, onPosition)
      return isSubscribed
    }
    return handleLocationUpdatesRequest()
  }

  @Synchronized
  fun onLifecycleChange(isInForeground: Boolean) {
    this.isInForeground = isInForeground
    handleLocationUpdatesRequest()
  }

  @Synchronized
  fun start(onPosition: (Position) -> Unit) {
    isStarted = true
    this.onPosition = { position ->
      lastPosition = position
      onPosition(position)
    }
    handleLocationUpdatesRequest()
  }

  @Synchronized
  fun stop() {
    isStarted = false
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
    return handleLocationUpdatesRequest()
  }

  @Synchronized
  fun release() {
    isReleased = true
    handleLocationUpdatesRequest()
  }

  fun getLastKnownPosition(): Position? {
    return lastPosition
  }

  @Synchronized
  fun status(): PositionWatchStatus {
    return PositionWatchStatus(
      isWatching = isStarted && !isReleased,
      isPaused = isPaused,
      isSubscribed = isSubscribed,
      activeParameters = activeParameters.toStatus(),
      stagedParameters = stagedParameters.toStatus()
    )
  }
}



class PositionWatchHandle(
  val session: PausableWatchSession
) : SharedObject() {

  override fun onStartListeningToEvent(eventName: String) {
    if (eventName == POSITION_CHANGED) {
      session.start { position -> emit(POSITION_CHANGED, PositionChangedEvent(data = position)) }
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

class LocationWatchHandleCreationException : CodedException("LocationWatchHandle cannot be created from JavaScript!")

