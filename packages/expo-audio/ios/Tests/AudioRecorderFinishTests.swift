#if os(iOS)
import Testing
import AVFoundation

@testable import ExpoModulesCore
@testable import ExpoAudio

@Suite("AudioRecorder finish")
@JavaScriptActor
struct AudioRecorderFinishTests {
  let appContext: AppContext
  let runtime: ExpoRuntime

  init() throws {
    appContext = AppContext.create()
    runtime = try appContext.runtime
    appContext.moduleRegistry.register(moduleType: AudioModule.self, name: "ExpoAudio")
  }

  private func makeRecorder() throws -> AudioRecorder {
    let recorder = try runtime.eval(
      """
      recorder = new expo.modules.ExpoAudio.AudioRecorder({
        extension: '.m4a',
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
        audioQuality: 127
      })
      """,
      "status = null",
      "recorder.addListener('recordingStatusUpdate', (payload) => { status = payload })",
      "recorder"
    )
    return try SharedObject.native(from: recorder.asObject(), as: AudioRecorder.self)
  }

  @Test
  func `reports an error when the recording does not finish successfully`() throws {
    let recorder = try makeRecorder()

    recorder.didFinish(recorder.ref, successfully: false)

    let status = try runtime.eval("status").asObject()
    #expect(try status.getProperty("isFinished").asBool() == true)
    #expect(try status.getProperty("hasError").asBool() == true)
    #expect(status.getProperty("error").isString() == true)
    #expect(status.getProperty("url").isNull() == true)
  }
}
#endif
