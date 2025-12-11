package expo.modules.plugin.utils

/**
 * Extracts a single file path from one line of an AndroidManifest merge log.
 *
 * @param line The raw single-line string from the build log.
 * @return A String containing the absolute file path to the manifest, or null if no path is found.
 */
fun extractPathFromLine(line: String): String? {
  // Regex to find a path starting with '/' and ending just before
  // the line/column numbers (e.g., :11:3)
  val regex = Regex("(/.*?):\\d+:\\d+.*")
  val match = regex.find(line)

  return match?.groups?.get(1)?.value
}
