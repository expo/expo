package expo.modules.appmetrics.crashreporting

import java.io.InputStream

/** Reads the thread dump that Android saves for an ANR (`ApplicationExitInfo.getTraceInputStream`). */
object AnrTrace {
  /**
   * The frame lines of the main thread, or null when the dump has no main thread. Stops reading at
   * the end of the main thread's block, because the full dump can be hundreds of kilobytes.
   */
  fun mainThreadFrames(input: InputStream): List<String>? {
    val frames = mutableListOf<String>()
    var inMainThread = false
    input.bufferedReader().useLines { lines ->
      for (line in lines) {
        if (!inMainThread) {
          inMainThread = line.startsWith("\"main\" ")
          continue
        }
        val trimmed = line.trim()
        if (trimmed.isEmpty()) {
          break
        }
        // `|` lines hold thread state, not frames.
        if (!trimmed.startsWith("|")) {
          frames += trimmed
        }
      }
    }
    return frames.ifEmpty { null }
  }
}
