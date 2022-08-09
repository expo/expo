package expo.modules.updates.logging

import java.io.IOException
import java.util.*
import kotlin.jvm.Throws

/**
 * Class for reading expo-updates logs
 */
class UpdatesLogReader {

  /**
   Get expo-updates logs newer than the given date
   Returns a list of strings in the JSON format of UpdatesLogEntry
   */
  @Throws(IOException::class)
  fun getLogEntries(newerThan: Date): List<String> {
    val epochTimestamp = newerThan.time
    val pid = "${android.os.Process.myPid()}"
    // Use logcat to read just logs with our tag, in long format
    val process = Runtime.getRuntime().exec("logcat -d -s ${UpdatesLogger.EXPO_UPDATES_LOGGING_TAG} -vlong")
    return process.inputStream.bufferedReader().useLines { lines ->
      // Format is one header line, followed by three lines per entry
      // First line has the tag, timestamp, pid, etc.
      // Second line has our log message
      // Third line is empty
      lines
        .drop(1)
        .chunked(3)
        .filter { lineTriple -> lineTriple[0].contains(pid) }
        .map { lineTriple -> UpdatesLogEntry.create(lineTriple[1]) }
        .filter { entry -> entry.timestamp >= epochTimestamp }
        .map { entry -> entry.asString() }
        .toList()
    }
  }
}
