import Testing
import AVFoundation

@testable import ExpoCamera

/// Stands in for the `ExpoCameraBarcodeScanning` companion pod.
private final class StubBarcodeProvider: NSObject, ExpoBarcodeScannerProvider {
  var supportedTypes: [String] {
    [AVMetadataObject.ObjectType.pdf417.rawValue]
  }

  func scanBarcodes(from image: CGImage) -> [[String: Any]] {
    []
  }
}

/// The ZXing provider ships as an optional companion pod (`ExpoCameraBarcodeScanning`). Every
/// barcode type expo-camera exposes is natively supported by `AVCaptureMetadataOutput`, so
/// scanning must keep working when that pod is not linked.
/// See https://github.com/expo/expo/issues/44491.
@Suite("BarcodeScanner")
struct BarcodeScannerTests {
  private func startScanning(provider: ExpoBarcodeScannerProvider?) -> AVCaptureSession {
    let session = AVCaptureSession()
    let scanner = BarcodeScanner(
      session: session,
      sessionQueue: DispatchQueue(label: "test.barcode"),
      provider: provider)

    scanner.setSettings([BARCODE_TYPES_KEY: [.qr]])
    scanner.setIsEnabled(true)
    return session
  }

  @Test
  func `scans through AVFoundation when the ZXing provider is not linked`() {
    let session = startScanning(provider: nil)

    #expect(session.outputs.contains { $0 is AVCaptureMetadataOutput })
  }

  @Test
  func `skips the video data output when the ZXing provider is not linked`() {
    let session = startScanning(provider: nil)

    #expect(!session.outputs.contains { $0 is AVCaptureVideoDataOutput })
  }

  @Test
  func `keeps both outputs when the ZXing provider is linked`() {
    let session = startScanning(provider: StubBarcodeProvider())

    #expect(session.outputs.contains { $0 is AVCaptureMetadataOutput })
    #expect(session.outputs.contains { $0 is AVCaptureVideoDataOutput })
  }
}
