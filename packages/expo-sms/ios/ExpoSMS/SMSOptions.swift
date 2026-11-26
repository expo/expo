import ExpoModulesCore

@Record
struct SMSOptions {
  var attachments: [SMSAttachment] = []
}

@Record
struct SMSAttachment {
  var uri: String = ""
  var mimeType: String = ""
  var filename: String = ""
}
