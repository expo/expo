import ExpoModulesCore

struct CameraRecordingOptionsLegacy: Record {
  @Field var maxDuration: Double?
  @Field var maxFileSize: Double?
  @Field var quality: VideoQuality?
  @Field var mute: Bool = false
  @Field var mirror: Bool = false
  @Field var codec: VideoCodecLegacy?
}
