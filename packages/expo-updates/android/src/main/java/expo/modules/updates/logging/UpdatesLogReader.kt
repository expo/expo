// Copyright 2022-present 650 Industries. All rights reserved.

// Reads expo-updates logs

package expo.modules.updates.logging

import java.io.BufferedReader
import java.io.IOException
import java.io.InputStreamReader
import java.util.*

class UpdatesLogReader {

  /**
   Get expo-updates logs newer than the given date
   Returns a list of strings in the JSON format of UpdatesLogEntry
   */
  fun getLogEntries(newerThan: Date): List<String> {
    val result: MutableList<String> = mutableListOf()
    val epochTimestamp = newerThan.time / 1000
    val pid = android.os.Process.myPid().toString()
    try {
      // Use logcat to read just logs with our tag, in long format (message on separate line)
      val process = Runtime.getRuntime().exec("logcat -d -s ${UpdatesLogger.LOGGING_TAG} -vlong")
      val bufferedReader = BufferedReader(
        InputStreamReader(process.inputStream)
      )
      var line: String? = ""
      var writeThisLine = false
      while (bufferedReader.readLine().also { line = it } != null) {
        if (writeThisLine) {
          // Check that it is a valid JSON string
          val entry = UpdatesLogEntry.create(line ?: "")
          // Check that timestamp is equal to or later than the passed in date before writing
          if (entry?.timestamp >= epochTimestamp) {
            result.add(line ?: "")
          }
          writeThisLine = false
        }
        if ((line ?: "").contains(pid)) {
          // Line has our PID, so write the next line if needed
          writeThisLine = true
        }
      }
    } catch (e: IOException) {
    }
    return result
  }
}
