package expo.modules.devlauncher.logs

import com.google.gson.GsonBuilder
import com.google.gson.annotations.Expose

@Suppress("UNUSED")
internal data class DevLauncherRemoteLog(
  val logBody: String,
  @Expose val level: String = "error",
  @Expose val mode: String = "BRIDGE"
) {
  constructor(
    throwable: Throwable,
    level: String = "error",
    mode: String = "BRIDGE"
  ) : this(throwable.toRemoteLogString(), level, mode)

  /**
   * `data` is an array whose members are simply concatenated before printing, so we use a trivial
   * array of just a single string (which may span multiple lines).
   */
  @Expose
  private val data = arrayOf(logBody)

  @Expose
  private val type = "log"

  fun toJson(): String {
    return GsonBuilder()
      .excludeFieldsWithoutExposeAnnotation()
      .create()
      .toJson(this)
  }
}

internal fun Throwable.toRemoteLogString(): String {
  val separator = "\n  "
  val baseTrace = stackTrace.joinToString(separator) {
    it.toString()
  }
  val remoteLogString = "$this$separator$baseTrace"

  cause?.let {
    return "$remoteLogString\nCaused by ${it.toRemoteLogString()}"
  }

  return remoteLogString
}
