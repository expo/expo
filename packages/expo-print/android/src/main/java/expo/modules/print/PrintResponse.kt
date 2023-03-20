package expo.modules.print

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import java.io.Serializable

internal class FilePrintResult(
  @Field var uri: String = "",
  @Field var numberOfPages: Int = 0,
  @Field var base64: String? = null
) : Record, Serializable
