package abi49_0_0.expo.modules.print

import abi49_0_0.expo.modules.kotlin.records.Field
import abi49_0_0.expo.modules.kotlin.records.Record
import java.io.Serializable

internal class PrintOptions(
  @Field var html: String? = null,
  @Field var uri: String? = null,
  @Field var width: Int? = null,
  @Field var height: Int? = null,
  @Field var orientation: String? = null,
  @Field var base64: Boolean = false,
) : Record, Serializable
