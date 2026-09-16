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
  private func makeScanner(
    session: AVCaptureSession,
    provider: ExpoBarcodeScannerProvider?
  ) -> BarcodeScanner {
    BarcodeScanner(
      session: session,
      sessionQueue: DispatchQueue(label: "test.barcode"),
      provider: provider)
  }

  private func startScanning(provider: ExpoBarcodeScannerProvider?) -> AVCaptureSession {
    let session = AVCaptureSession()
    let scanner = makeScanner(session: session, provider: provider)

    // pdf417 overlaps the stub's supportedTypes, so the provider path is genuinely live.
    scanner.setSettings([BARCODE_TYPES_KEY: [.qr, .pdf417]])
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

  // BarcodeScanner holds the delegate, which holds the scanner back as its response handler.
  // Nothing broke that cycle on teardown, so every camera mount leaked a scanner, a delegate,
  // a CIContext and a capture session.
  @Test
  func `releases the scanner once scanning stops`() {
    weak var leaked: BarcodeScanner?

    autoreleasepool {
      let session = AVCaptureSession()
      let scanner = makeScanner(session: session, provider: nil)
      leaked = scanner

      scanner.setSettings([BARCODE_TYPES_KEY: [.qr]])
      scanner.setIsEnabled(true)
      scanner.setIsEnabled(false)
    }

    #expect(leaked == nil)
  }
}
