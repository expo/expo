package expo.modules.sqlite

import java.io.File
import java.io.IOException
import java.util.ArrayList

@Throws(IOException::class)
internal fun ensureDirExists(dir: File): File {
  if (!dir.isDirectory) {
    if (dir.isFile) {
      throw IOException("Path '$dir' points to a file, but must point to a directory.")
    }
    if (!dir.mkdirs()) {
      var additionalErrorMessage = ""
      if (dir.exists()) {
        additionalErrorMessage = "Path already points to a non-normal file."
      }
      if (dir.parentFile == null) {
        additionalErrorMessage = "Parent directory is null."
      }
      throw IOException("Couldn't create directory '$dir'. $additionalErrorMessage")
    }
  }
  return dir
}

internal fun pluginResultsToPrimitiveData(results: List<SQLiteModule.SQLitePluginResult>): List<Any> {
  return results.map { convertPluginResultToArray(it) }
}

private fun convertPluginResultToArray(result: SQLiteModule.SQLitePluginResult): List<Any?> {
  val rowsContent = result.rows.map { row ->
    row?.map { value ->
      when (value) {
        null -> null
        is String -> value
        is Boolean -> value
        else -> (value as Number).toDouble()
      }
    }
  }

  return arrayListOf(
      result.error?.message,
      result.insertId.toInt(),
      result.rowsAffected,
      result.columns,
      rowsContent,
  )
}

private fun isPragma(str: String): Boolean {
  return startsWithCaseInsensitive(str, "pragma")
}

private fun isPragmaReadOnly(str: String): Boolean {
  if (!isPragma(str)) {
    return false
  }
  return !str.contains('=')
}

internal fun isSelect(str: String): Boolean {
  return startsWithCaseInsensitive(str, "select") || isPragmaReadOnly(str)
}

internal fun isInsert(str: String): Boolean {
  return startsWithCaseInsensitive(str, "insert")
}

internal fun isUpdate(str: String): Boolean {
  return startsWithCaseInsensitive(str, "update")
}

internal fun isDelete(str: String): Boolean {
  return startsWithCaseInsensitive(str, "delete")
}

// identify an "insert"/"select" query more efficiently than with a Pattern
private fun startsWithCaseInsensitive(str: String, substr: String): Boolean {
  var i = -1
  val len = str.length
  while (++i < len) {
    val ch = str[i]
    if (!Character.isWhitespace(ch)) {
      break
    }
  }
  var j = -1
  val substrLen = substr.length
  while (++j < substrLen) {
    if (j + i >= len) {
      return false
    }
    val ch = str[j + i]
    if (Character.toLowerCase(ch) != substr[j]) {
      return false
    }
  }
  return true
}

internal fun convertParamsToStringArray(paramArrayArg: ArrayList<Any?>): Array<String?> {
  return paramArrayArg.map { param ->
    when (param) {
      is String -> unescapeBlob(param)
      is Boolean -> if (param) "1" else "0"
      is Double -> param.toString()
      null -> null
      else -> throw ClassCastException("Could not find proper SQLite data type for argument: $")
    }
  }.toTypedArray()
}

private fun unescapeBlob(str: String): String {
  return str.replace("\u0001\u0001", "\u0000")
      .replace("\u0001\u0002", "\u0001")
      .replace("\u0002\u0002", "\u0002")
}