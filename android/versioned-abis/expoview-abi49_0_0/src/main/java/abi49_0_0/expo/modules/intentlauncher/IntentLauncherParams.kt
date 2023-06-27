package abi49_0_0.expo.modules.intentlauncher

import abi49_0_0.expo.modules.kotlin.records.Field
import abi49_0_0.expo.modules.kotlin.records.Record

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
