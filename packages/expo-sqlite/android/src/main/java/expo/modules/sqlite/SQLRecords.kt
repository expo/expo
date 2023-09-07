package expo.modules.sqlite

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

data class Query(
  @Field
  val sql: String,
  @Field
  val args: List<Any?>
) : Record

enum class SqlAction(val value: String) : Enumerable {
  INSERT("insert"),
  UPDATE("update"),
  DELETE("delete"),
  UNKNOWN("unknown")
}
