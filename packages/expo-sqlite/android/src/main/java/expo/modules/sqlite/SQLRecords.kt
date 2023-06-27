package expo.modules.sqlite

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class Query(
  @Field
  val sql: String,
  @Field
  val args: List<Any?>
) : Record
