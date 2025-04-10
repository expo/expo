package expo.modules.filesystem.next

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class CreateOptions(
  @Field
  val intermediates: Boolean = false,
  @Field
  val overwrite: Boolean = false
) : Record
