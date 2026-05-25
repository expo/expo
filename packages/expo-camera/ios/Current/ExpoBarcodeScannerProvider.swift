import AVFoundation

/// Protocol for barcode scanner providers.
/// Implement this in a separate module and expose via @objc(ExpoCameraZXingProvider) for runtime discovery.
///
/// Returned dictionaries should have `"type"` and `"data"` keys matching the shape expected by the JS event.
@objc public protocol ExpoBarcodeScannerProvider {
  /// The AVMetadataObject.ObjectType raw values this provider handles.
  @objc var supportedTypes: [String] { get }

  /// Scan a video frame for barcodes. Returns result dictionaries or an empty array.
  @objc func scanBarcodes(from image: CGImage) -> [[String: Any]]
}
