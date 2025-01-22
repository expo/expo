package expo.modules.print

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

internal class PrintOptions(
  @Field var html: String? = null,
  @Field var uri: String? = null,
  @Field var width: Int? = null,
  @Field var height: Int? = null,
  @Field var orientation: String? = null,
  @Field var textZoom: Int? = null,
  @Field var base64: Boolean = false
) : Record, Serializable
