package expo.modules.print

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

internal class PrintOptions(
  @Field var html: String? = null,
  @Field var printerUrl: String? = null,
  @Field var uri: String? = null,
  @Field var width: Int? = null,
  @Field var height: Int? = null,
  @Field var orientation: String? = null,
  @Field var margins: Map<String, Float>? = null,
  @Field var base64: Boolean = false,
  @Field var format: String? = null,
  @Field var useMarkupFormatter: Boolean = false,
  @Field var markupFormatterIOS: String? = null
) : Record, Serializable
