package expo.modules.devlauncher.logs

import com.google.gson.Gson
import com.google.gson.GsonBuilder
import com.google.gson.annotations.Expose

internal interface DevLauncherRemoteLogBody {
  val message: String
  val stack: String?

  fun toJson(): String
}

internal class DevLauncherSimpleRemoteLogBody(override val message: String) : DevLauncherRemoteLogBody {
  override val stack: String? = null

  override fun toJson(): String = message
}

internal class DevLauncherExceptionRemoteLogBody(exception: Throwable) : DevLauncherRemoteLogBody {
  override val message: String = exception.toString()
  override val stack: String = exception.stackTraceToRemoteLogString()

  override fun toJson(): String = Gson().toJson(this)
}

internal data class DevLauncherRemoteLog(
  val logBody: DevLauncherRemoteLogBody,
  @Expose val level: String = "error"
) {
  @Expose
  val includesStack = logBody.stack !== null

  @Suppress("UNUSED")
  @Expose
  private val body = logBody.toJson()

  fun toJson(): String {
    return GsonBuilder()
      .excludeFieldsWithoutExposeAnnotation()
      .create()
      .toJson(this)
  }
}

internal fun Throwable.stackTraceToRemoteLogString(): String {
  val baseTrace = stackTrace.joinToString(separator = "\n") {
    it.toString()
  }

  cause?.let {
    return baseTrace + "\nCaused By ${it.stackTraceToRemoteLogString()}"
  }

  return baseTrace
}
