import Testing
import UIKit
import AVFoundation
import ExpoModulesCore

@testable import ExpoCamera

/// Minimal stand-in for `CameraView` as seen by `CameraPhotoCapture`.
/// Every property mirrors the real defaults in `CameraView.swift`.
private final class MockCameraViewDelegate: CameraPhotoCaptureDelegate {
  var appContext: AppContext?
  let previewLayer = AVCaptureVideoPreviewLayer()
  var deviceOrientation: UIInterfaceOrientation = .portrait
  var responsiveWhenOrientationLocked = false
  var physicalOrientation: UIDeviceOrientation = .portrait
  var presetCamera: AVCaptureDevice.Position = .back
  var mirror = false
  var flashMode: FlashMode = .off
  let onPictureSaved = EventDispatcher()

  var animateShutter = true
  private(set) var shutterAnimationCount = 0

  func playShutterAnimation() {
    shutterAnimationCount += 1
  }
}

@Suite("CameraPhotoCapture")
struct CameraPhotoCaptureTests {
  // Moving the `AVCapturePhotoCaptureDelegate` conformance off `CameraView` in #37393 carried
  // over the shutter *sound* handling but dropped the shutter *animation*, so `animateShutter`
  // became a prop nothing on iOS ever read. See https://github.com/expo/expo/issues/47433.
  @Test
  func `plays the shutter animation when a capture begins`() {
    let delegate = MockCameraViewDelegate()
    let capture = CameraPhotoCapture(delegate: delegate)

    capture.willCapturePhoto()

    #expect(delegate.shutterAnimationCount == 1)
  }

  @Test
  func `does not play the shutter animation when animateShutter is false`() {
    let delegate = MockCameraViewDelegate()
    delegate.animateShutter = false
    let capture = CameraPhotoCapture(delegate: delegate)

    capture.willCapturePhoto()

    #expect(delegate.shutterAnimationCount == 0)
  }
}
