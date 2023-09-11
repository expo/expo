package expo.modules.intentlauncher

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class IntentLauncherParams(
  @Field
  val type: String?,

  @Field
  val category: String?,

  @Field
  val extra: Map<String, Any>?,

  @Field
  val data: String?,

  @Field
  val flags: Int?,

  @Field
  val packageName: String?,

  @Field
  val className: String?
) : Record
