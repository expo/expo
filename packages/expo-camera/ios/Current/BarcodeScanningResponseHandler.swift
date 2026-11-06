protocol BarcodeScanningResponseHandler: AnyObject {
  func onScanningResult(_ result: [String: Any])
}
