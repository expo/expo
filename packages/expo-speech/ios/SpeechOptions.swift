import ExpoModulesCore

struct SpeechOptions: Record {
  @Field
  var language: String?
  @Field
  var pitch: Double?
  @Field
  var rate: Double?
  @Field
  var voice: String?
}

struct VoiceInfo: Record {
  @Field
  var identifier: String? = nil
  @Field
  var name: String? = nil
  @Field
  var quality: String? = nil
  @Field
  var language: String? = nil
}
