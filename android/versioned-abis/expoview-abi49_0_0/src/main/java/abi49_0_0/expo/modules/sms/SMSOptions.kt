package abi49_0_0.expo.modules.sms

import abi49_0_0.expo.modules.kotlin.records.Field
import abi49_0_0.expo.modules.kotlin.records.Record

data class SMSOptions(
  @Field val attachments: List<SMSAttachment> = emptyList()
) : Record

data class SMSAttachment(
  @Field val uri: String,
  @Field val mimeType: String,
  @Field val filename: String,
) : Record
