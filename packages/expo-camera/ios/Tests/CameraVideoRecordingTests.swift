import Testing
import UIKit
import AVFoundation
@testable import ExpoModulesCore

@testable import ExpoCamera

private final class MockCameraVideoRecordingDelegate: CameraVideoRecordingDelegate {
  var responsiveWhenOrientationLocked = false
  var physicalOrientation: UIDeviceOrientation = .portrait
  var deviceOrientation: UIInterfaceOrientation = .portrait
  var mirror = false
  var appContext: AppContext?
  var videoBitrate: Int?
  var videoStabilizationMode: VideoStabilizationMode = .auto
  let onRecordingProgress = EventDispatcher()
}

private final class RecordingMovieFileOutput: AVCaptureMovieFileOutput {
  override var isRecording: Bool { true }
}

private final class PromiseResult: @unchecked Sendable {
  var rejection: Exception?
}

@Suite("CameraVideoRecording")
struct CameraVideoRecordingTests {
  @Test
  func `rejects a recording that starts while another one is active`() async {
    let delegate = MockCameraVideoRecordingDelegate()
    let recording = CameraVideoRecording(delegate: delegate)
    let result = PromiseResult()
    let promise = Promise(appContext: nil) { _ in } rejecter: { result.rejection = $0 }

    await recording.record(options: CameraRecordingOptions(), videoFileOutput: RecordingMovieFileOutput(), promise: promise)

    #expect(result.rejection is CameraAlreadyRecordingException)
  }
}
