package expo.modules.devlauncher.logs

import com.google.gson.GsonBuilder
import com.google.gson.annotations.Expose

@Suppress("UNUSED")
internal data class DevLauncherRemoteLog(
  val messages: List<String>,
  @Expose val level: String = "error",
  @Expose val mode: String = "BRIDGE"
) {
  /**
   * `data` is an array whose members are simply concatenated with a space before printing to the
   * console, so we join messages with a newline and send an array consisting of just a single item.
   */
  @Expose
  private val data = arrayOf(messages.joinToString("\n"))

  @Expose
  private val type = "log"

  fun toJson(): String {
    return GsonBuilder()
      .excludeFieldsWithoutExposeAnnotation()
      .create()
      .toJson(this)
  }
}
