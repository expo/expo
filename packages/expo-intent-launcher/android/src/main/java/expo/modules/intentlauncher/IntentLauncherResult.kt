package expo.modules.intentlauncher

import android.net.Uri
import android.os.Bundle
import expo.modules.intentlauncher.exceptions.UnsupportedExtraException
import io.github.expo.modules.v2.Record

@Record
data class IntentLauncherResult(
  val resultCode: Int,
  val data: String? = null,
  val extra: Map<String, Any?>? = null
)

internal fun Bundle.toMap(): Map<String, Any?> = keySet().associateWith { key ->
  @Suppress("DEPRECATION")
  toJSValue(key, get(key))
}

private fun toJSValue(key: String, value: Any?): Any? = when (value) {
  null, is String, is Boolean, is Int -> value
  is Number -> value.toDouble()
  is Uri -> value.toString()
  is Bundle -> value.toMap()
  is Array<*> -> value.map { toJSValue(key, it) }
  is Collection<*> -> value.map { toJSValue(key, it) }
  is IntArray -> value.toList()
  is LongArray -> value.map { it.toDouble() }
  is FloatArray -> value.map { it.toDouble() }
  is DoubleArray -> value.toList()
  is BooleanArray -> value.toList()
  else -> throw UnsupportedExtraException(key, value.javaClass)
}
