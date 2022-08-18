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

  cause?.let {
    return baseTrace + "\nCaused by ${it.toRemoteLogString()}"
  }

  return "$this$separator$baseTrace"
}
