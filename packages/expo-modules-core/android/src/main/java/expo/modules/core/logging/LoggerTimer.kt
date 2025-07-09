package expo.modules.core.logging

import kotlin.time.Duration

/**
 * An instance of a timer.
 */
interface LoggerTimer {
  /**
   * End the timer and log a timer entry.
   *
   * @return final duration in Milliseconds
   */
  fun stop(): Duration
}
