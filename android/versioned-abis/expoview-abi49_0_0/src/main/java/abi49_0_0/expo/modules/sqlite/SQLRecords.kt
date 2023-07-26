package abi49_0_0.expo.modules.sqlite

import abi49_0_0.expo.modules.kotlin.records.Field
import abi49_0_0.expo.modules.kotlin.records.Record

data class Query(
  @Field
  val sql: String,
  @Field
  val args: List<Any?>
) : Record
