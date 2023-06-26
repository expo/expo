import ABI49_0_0ExpoModulesCore

struct SMSOptions: Record {
  @Field var attachments: [SMSAttachment]
}

struct SMSAttachment: Record {
  @Field var uri: String
  @Field var mimeType: String
  @Field var filename: String
}
