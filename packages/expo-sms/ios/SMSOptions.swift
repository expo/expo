import ExpoModulesCore

struct SmsOptions: Record {
  @Field var attachments: [SmsAttachment]
}

struct SmsAttachment: Record {
  @Field var uri: String
  @Field var mimeType: String
  @Field var filename: String
}
