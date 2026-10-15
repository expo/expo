// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import io.github.expo.modules.v2.Record

internal enum class SQLAction(val value: String) {
  INSERT("insert"),
  UPDATE("update"),
  DELETE("delete"),
  UNKNOWN("unknown");

  companion object {
    fun fromCode(value: Int): SQLAction {
      return when (value) {
        9 -> DELETE
        18 -> INSERT
        23 -> UPDATE
        else -> UNKNOWN
      }
    }
  }
}

@Record
internal data class DatabaseChangeEvent(
  val databaseName: String,
  val databaseFilePath: String,
  val tableName: String,
  val rowId: Long,
  val typeId: SQLAction
)

/** What running a statement reports: its effect, and the first row it produced, if any. */
@Record(bufferSafe = false)
internal data class RunResult(
  val lastInsertRowId: Long,
  val changes: Int,
  val firstRowValues: List<Any?>
)
