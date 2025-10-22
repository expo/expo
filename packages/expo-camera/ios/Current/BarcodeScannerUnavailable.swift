#if !canImport(ZXingObjC)
import AVFoundation

class BarcodeScanner: NSObject, BarcodeScanningResponseHandler {
  private var onBarcodeScanned: (([String: Any]?) -> Void)?
  var isScanningBarcodes = false

  init(session: AVCaptureSession, sessionQueue: DispatchQueue) {}

  func setSettings(_ newSettings: [String: [AVMetadataObject.ObjectType]]) {}

  func setPreviewLayer(layer: AVCaptureVideoPreviewLayer) {}

  func setIsEnabled(_ enabled: Bool) {
    isScanningBarcodes = enabled
    if enabled {
      onBarcodeScanned?(nil)
    }
  }

  func setConnection(enabled: Bool) {}

  func setOnBarcodeScanned(_ onBarcodeScanned: @escaping ([String: Any]?) -> Void) {
    self.onBarcodeScanned = onBarcodeScanned
  }

  func maybeStartBarcodeScanning() {}

  func stopBarcodeScanning() {
    if isScanningBarcodes {
      isScanningBarcodes = false
      onBarcodeScanned?(nil)
    }
  }

  func onScanningResult(_ result: [String: Any]) {
    onBarcodeScanned?(result)
  }
}
#endif
