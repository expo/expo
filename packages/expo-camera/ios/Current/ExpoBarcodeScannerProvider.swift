import AVFoundation

/// Protocol for barcode scanner providers.
/// Implement this in a separate module and expose via @objc(ExpoCameraZXingProvider) for runtime discovery.
///
/// Returned dictionaries should have `"type"` and `"data"` keys. `"type"` must be the short
/// expo `BarcodeType` string the JS event expects (e.g. `"pdf417"`), matching the native
/// AVFoundation scan path — not the raw `AVMetadataObject.ObjectType` value (e.g. `"org.iso.PDF417"`).
@objc public protocol ExpoBarcodeScannerProvider {
  /// The AVMetadataObject.ObjectType raw values this provider handles.
  @objc var supportedTypes: [String] { get }

  /// Scan a video frame for barcodes. Returns result dictionaries or an empty array.
  @objc func scanBarcodes(from image: CGImage) -> [[String: Any]]
}
