package expo.modules.location.next

import expo.modules.kotlin.exception.CodedException
import kotlin.time.Duration

class PositionWatchHandle(session: PausableWatchSession) : WatchHandle(session, POSITION_CHANGED)

class PositionWatchSubscriptionException : CodedException("Could not subscribe to location updates")
class InvalidWatchIntervalException(interval: Duration) :
  CodedException("Location update interval must be finite and non-negative, but received $interval. Pass a number of seconds greater than or equal to 0.")
