package abi49_0_0.expo.modules.print

import abi49_0_0.expo.modules.kotlin.records.Field
import abi49_0_0.expo.modules.kotlin.records.Record
import java.io.Serializable

internal class FilePrintResult(
  @Field var uri: String = "",
  @Field var numberOfPages: Int = 0,
  @Field var base64: String? = null
) : Record, Serializable
