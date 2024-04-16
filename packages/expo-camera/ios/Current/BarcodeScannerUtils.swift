import AVFoundation
import ZXingObjC
import VisionKit

class BarcodeScannerUtils {
  static func getDefaultSettings() -> [String: [AVMetadataObject.ObjectType]] {
    var validTypes = [
      "upc_e": AVMetadataObject.ObjectType.upce,
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
      "datamatrix": AVMetadataObject.ObjectType.dataMatrix
    ]

    if #available(iOS 15.4, *) {
      validTypes["codabar"] = AVMetadataObject.ObjectType.codabar
    }

    return [BARCODE_TYPES_KEY: Array(validTypes.values)]
  }

  static func avMetadataCodeObjectToDictionary(_ barcodeScannerResult: AVMetadataMachineReadableCodeObject) -> [String: Any] {
    var result = [String: Any]()
    result["type"] = barcodeScannerResult.type
    result["data"] = barcodeScannerResult.stringValue

    if !barcodeScannerResult.corners.isEmpty {
      var cornerPointsResult = [[String: Any]]()
      for point in barcodeScannerResult.corners {
        cornerPointsResult.append(["x": point.x, "y": point.y])
      }
      result["cornerPoints"] = cornerPointsResult
      result["bounds"] = [
        "origin": [
          "x": barcodeScannerResult.bounds.origin.x,
          "y": barcodeScannerResult.bounds.origin.y
        ],
        "size": [
          "width": barcodeScannerResult.bounds.size.width,
          "height": barcodeScannerResult.bounds.size.height
        ]
      ]
    } else {
      addEmptyCornerPoints(to: &result)
    }
    return result
  }

  @available(iOS 16.0, *)
  static func visionDataScannerObjectToDictionary(item: RecognizedItem.Barcode) -> [String: Any] {
    var result = [String: Any]()
    result["type"] = item.observation.symbology.rawValue
    result["data"] = item.payloadStringValue

    let bounds = item.bounds
    let cornerPoints: [[String: Any]] = [bounds.bottomLeft, bounds.bottomRight, bounds.topLeft, bounds.topRight].map { point in
      ["x": point.x, "y": point.y]
    }
    result["cornerPoints"] = cornerPoints

    return result
  }

  static func addEmptyCornerPoints(to result: inout [String: Any]) {
    result["cornerPoints"] = []
    result["bounds"] = [
      "origin": [
        "x": 0,
        "y": 0
      ],
      "size": [
        "width": 0,
        "height": 0
      ]
    ]
  }

  static func zxResultToDictionary(_ barcodeScannerResult: ZXResult) -> [String: Any] {
    var result = [String: Any]()
    result["type"] = BarcodeScannerUtils.zxingFormatToString(barcodeScannerResult.barcodeFormat)

    var data = ""
    for i in 0..<barcodeScannerResult.text.count {
      let character = barcodeScannerResult.text[barcodeScannerResult.text.index(barcodeScannerResult.text.startIndex, offsetBy: i)]
      if character != "\0" {
        data.append(character)
      }
    }
    result["data"] = data

    return result
  }

  static func zxingFormatToString(_ format: ZXBarcodeFormat) -> String {
    switch format {
    case kBarcodeFormatPDF417:
      return AVMetadataObject.ObjectType.pdf417.rawValue
    case kBarcodeFormatCode39:
      return AVMetadataObject.ObjectType.code39.rawValue
    case kBarcodeFormatCodabar:
      if #available(iOS 15.4, *) {
        return AVMetadataObject.ObjectType.codabar.rawValue
      }
      return "unknown"
    default:
      return "unknown"
    }
  }
}
