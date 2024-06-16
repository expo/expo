package expo.modules.sms

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

data class SMSOptions(
  @Field val attachments: List<SMSAttachment> = emptyList()
) : Record

data class SMSAttachment(
  @Field val uri: String,
  @Field val mimeType: String,
  @Field val filename: String
) : Record
