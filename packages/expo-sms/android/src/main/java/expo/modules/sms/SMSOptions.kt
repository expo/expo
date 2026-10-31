package expo.modules.sms

import io.github.expo.modules.v2.Record

@Record
data class SMSOptions(
  val attachments: List<SMSAttachment> = emptyList()
)

@Record
data class SMSAttachment(
  val uri: String,
  val mimeType: String,
  val filename: String
)

@Record
data class SMSResult(
  val result: String
)
