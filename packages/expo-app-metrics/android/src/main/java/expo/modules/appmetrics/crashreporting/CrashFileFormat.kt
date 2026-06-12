package expo.modules.appmetrics.crashreporting

/**
 * The on-disk contract for pending-crash files, shared by `CrashFileWriter` and
 * `CrashFileReader`. Keeping the format in one place means the writer and reader
 * can't drift apart on the separator or the escaping rules.
 */
internal object CrashFileFormat {
  /** Separates the `key=value` header block from the stack frames below it. */
  const val HEADER_SEPARATOR = "---"

  /**
   * Suffix for the temp file the writer fills in before atomically renaming it to its final
   * `crash-{pid}-{timestamp}.txt` name. The write happens on the crash path inside a dying process,
   * so a write can be truncated or orphaned at any point; staging under `.tmp` and committing with a
   * rename makes the final file appear all-at-once or not at all. Because `FILE_NAME_PATTERN` only
   * matches the final `.txt` name, the reader never picks up a `.tmp` file that is still being
   * written (or was left behind by a process that died mid-write), so it only ever parses complete
   * files. An orphan left by a mid-write death is swept on the next launch by
   * `CrashFileReader.deleteOrphanedTempFiles`.
   */
  const val TEMP_SUFFIX = ".tmp"

  /** Matches a finished pending-crash file (`crash-{pid}-{timestamp}.txt`); skips `.tmp` by design. */
  val FILE_NAME_PATTERN = Regex("""crash-\d+-\d+\.txt""")

  /** Matches an orphaned/in-progress temp file (`crash-{pid}-{timestamp}.txt.tmp`); group 1 is the pid. */
  val TEMP_FILE_PATTERN = Regex("""crash-(\d+)-\d+\.txt\.tmp""")

  /**
   * The canonical pending-crash directory — `noBackupFilesDir` so stale crash
   * files never ride along in device-to-device restores. Shared by `CrashFileWriter`
   * and `CrashFileReader` so the two always agree on where crashes live.
   */
  fun crashesDir(context: android.content.Context): java.io.File =
    java.io.File(context.noBackupFilesDir, "expo-app-metrics/crashes")

  fun escape(value: String): String =
    value.replace("\\", "\\\\").replace("\n", "\\n").replace("\r", "\\r")

  fun unescape(value: String): String {
    val result = StringBuilder(value.length)
    var index = 0
    while (index < value.length) {
      val char = value[index]
      if (char == '\\' && index + 1 < value.length) {
        val next = value[index + 1]
        val unescaped = when (next) {
          'n' -> '\n'
          'r' -> '\r'
          '\\' -> '\\'
          else -> null
        }
        if (unescaped != null) {
          result.append(unescaped)
          index += 2
          continue
        }
      }
      result.append(char)
      index++
    }
    return result.toString()
  }
}
