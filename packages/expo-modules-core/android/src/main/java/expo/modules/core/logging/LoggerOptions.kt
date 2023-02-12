package expo.modules.core.logging

import java.util.*

/**
 * A class defining the logging options that are currently supported.
 * Future options may include writing to a DB or other destinations
 */
class LoggerOptions(
  private val bitSet: BitSet
) {

  fun contains(other: LoggerOptions): Boolean {
    return bitSet.intersects(other.bitSet)
  }

  companion object {
    val logToOS = LoggerOptions(BitSet.valueOf(longArrayOf(1L)))
    val logToFile = LoggerOptions(BitSet.valueOf(longArrayOf(2L)))

    fun union(loggerOptions: List<LoggerOptions>): LoggerOptions {
      val result = BitSet.valueOf(longArrayOf(0L))
      loggerOptions.forEach { loggerOption ->
        result.or(loggerOption.bitSet)
      }
      return LoggerOptions(result)
    }
  }
}
