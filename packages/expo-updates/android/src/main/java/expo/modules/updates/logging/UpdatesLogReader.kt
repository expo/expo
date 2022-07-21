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
    val process = Runtime.getRuntime().exec("logcat -d -s ${UpdatesLogger.LOGGING_TAG} -vlong")
    return process.inputStream.bufferedReader().useLines { lines ->
      lines
        .chunked(2)
        .filter { linePair -> linePair.first().contains(pid) }
        .map { linePair -> UpdatesLogEntry.create(linePair.last()) }
        .filter { entry -> entry.timestamp > epochTimestamp  }
        .map { entry -> entry.asString() }
        .toList()
    }
  }
}
