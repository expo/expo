import Testing
import UIKit
import AVFoundation
import ExpoModulesCore

@testable import ExpoCamera

/// Mirrors `CameraView`'s arrangement: the view's backing layer is the preview layer.
private final class PreviewHostView: UIView {
  override class var layerClass: AnyClass {
    AVCaptureVideoPreviewLayer.self
  }
  var previewLayer: AVCaptureVideoPreviewLayer {
    // swiftlint:disable:next force_cast
    layer as! AVCaptureVideoPreviewLayer
  }
}

/// Minimal stand-in for `CameraView` as seen by `CameraSessionManager`.
/// Every property mirrors the real defaults in `CameraView.swift`.
private final class MockCameraViewDelegate: NSObject, CameraSessionManagerDelegate {
  let sessionQueue = DispatchQueue(label: "captureSessionQueue")
  var videoQuality: VideoQuality = .video1080p
  var mode: CameraMode = .picture
  var pictureSize: PictureSize = .photo
  var isMuted = false
  var active = true
  var presetCamera: AVCaptureDevice.Position = .back
  var selectedLens: String?
  var torchEnabled = false
  var autoFocus: AVCaptureDevice.FocusMode = .continuousAutoFocus
  var zoom: CGFloat = 0
  let onMountError = EventDispatcher()
  let onCameraReady = EventDispatcher()
  var permissionsManager: EXPermissionsInterface?
  var appContext: AppContext?
  var barcodeScanner: BarcodeScanner?

  func emitAvailableLenses() {}
  func configurePreviewRotation() {}
}

@Suite("CameraSessionManager")
struct CameraSessionManagerTests {
  // Starting a session that has no capture device leaves it wedged: the capture backend
  // never acknowledges, so every later graph rebuild waits out its own ~9s deadline. The
  // preview layer detaches from the still-running session in `dealloc` on the main
  // thread, which is where that wait lands. Mounting and unmounting a `CameraView` eight
  // times froze the UI for over a minute. See https://github.com/expo/expo/issues/48780.
  @Test(.enabled(if: AVCaptureDevice.default(for: .video) == nil))
  func `does not start the session when no capture device is available`() {
    let delegate = MockCameraViewDelegate()
    let manager = CameraSessionManager(delegate: delegate)

    // Binding the preview layer is what makes the capture backend engage, and is what
    // `CameraView.setupPreview()` does on mount.
    let view = PreviewHostView()
    view.previewLayer.session = manager.session

    manager.updateCameraIsActive()

    #expect(manager.session.isRunning == false)
  }
}
