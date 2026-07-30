import AVFoundation
import VisionKit
import Vision

class BarcodeScannerUtils {
  static func getDefaultSettings() -> [String: [AVMetadataObject.ObjectType]] {
    let validTypes = [
      "upc_e": AVMetadataObject.ObjectType.upce,
      "upc_a": AVMetadataObject.ObjectType.ean13,
      "code39": AVMetadataObject.ObjectType.code39,
      "code39mod43": AVMetadataObject.ObjectType.code39Mod43,
      "ean13": AVMetadataObject.ObjectType.ean13,
      "ean8": AVMetadataObject.ObjectType.ean8,
      "code93": AVMetadataObject.ObjectType.code93,
      "code128": AVMetadataObject.ObjectType.code128,
      "pdf417": AVMetadataObject.ObjectType.pdf417,
      "qr": AVMetadataObject.ObjectType.qr,
      "aztec": AVMetadataObject.ObjectType.aztec,
      "interleaved2of5": AVMetadataObject.ObjectType.interleaved2of5,
      "itf14": AVMetadataObject.ObjectType.itf14,
      "datamatrix": AVMetadataObject.ObjectType.dataMatrix,
      "codabar": AVMetadataObject.ObjectType.codabar
    ]

    return [BARCODE_TYPES_KEY: Array(validTypes.values)]
  }

  // AVFoundation reports Interleaved 2 of 5 codes as either .itf14 or .interleaved2of5. Registering
  // both when itf14 is requested mirrors Android ML Kit's single FORMAT_ITF and avoids dropping scans.
  static func augmentedBarcodeTypes(_ types: [AVMetadataObject.ObjectType]) -> [AVMetadataObject.ObjectType] {
    var augmented = types
    if augmented.contains(.itf14) && !augmented.contains(.interleaved2of5) {
      augmented.append(.interleaved2of5)
    }
    return augmented
  }

  static func avMetadataCodeObjectToDictionary(_ barcodeScannerResult: AVMetadataMachineReadableCodeObject) -> [String: Any] {
    var result = [String: Any]()
    result["type"] = BarcodeType.toBarcodeType(type: barcodeScannerResult.type).rawValue
    result["data"] = normalizeBarcodeValue(
      barcodeScannerResult.stringValue,
      isEAN13: barcodeScannerResult.type == .ean13
    )

    if !barcodeScannerResult.corners.isEmpty {
      result["cornerPoints"] = BarcodeUtils.cornerPoints(from: barcodeScannerResult.corners)
      result["bounds"] = BarcodeUtils.bounds(from: barcodeScannerResult.bounds)
    } else {
      BarcodeUtils.addEmptyCornerPoints(to: &result)
    }
    return result
  }

  @available(iOS 16.0, *)
  static func visionDataScannerObjectToDictionary(item: RecognizedItem.Barcode) -> [String: Any] {
    var result = [String: Any]()
    result["type"] = item.observation.symbology.rawValue
    result["data"] = normalizeBarcodeValue(
      item.payloadStringValue,
      isEAN13: item.observation.symbology == .ean13
    )

    let bounds = item.bounds
    result["cornerPoints"] = BarcodeUtils.cornerPoints(
      from: [bounds.bottomLeft, bounds.bottomRight, bounds.topLeft, bounds.topRight]
    )

    return result
  }

  // iOS reports upc_a as ean13 with an extra leading zero; strip it so the value matches the code.
  static func normalizeBarcodeValue(_ value: String?, isEAN13: Bool) -> String? {
    guard let value else {
      return nil
    }
    if isEAN13 && !value.isEmpty && value.hasPrefix("0") {
      return String(value.dropFirst())
    }
    return value
  }
}
