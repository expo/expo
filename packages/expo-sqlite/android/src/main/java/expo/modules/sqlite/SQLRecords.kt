// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

internal data class Query(
  @Field
  val sql: String,
  @Field
  val args: List<Any?>
) : Record

internal enum class SQLAction(val value: String) : Enumerable {
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
