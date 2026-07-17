import AVFoundation

public struct BarcodeUtils {
  static func getResultFrom(_ features: [CIFeature]) -> [[AnyHashable: Any]?] {
    var result = [[AnyHashable: Any]?]()

    for feature in features {
      if let qrCodeFeature = feature as? CIQRCodeFeature {
        let item = ciQRCodeFeature(
          codeFeature: qrCodeFeature
        )
        result.append(item)
      }
    }

    return result
  }

  static func ciQRCodeFeature(codeFeature: CIQRCodeFeature) -> [String: Any] {
    var result: [String: Any] = [:]
    result["type"] = "qr"
    result["data"] = codeFeature.messageString

    if !codeFeature.bounds.isEmpty {
      result["cornerPoints"] = cornerPoints(from: [
        codeFeature.topLeft,
        codeFeature.topRight,
        codeFeature.bottomRight,
        codeFeature.bottomLeft
      ])
      result["bounds"] = bounds(from: codeFeature.bounds)
    } else {
      addEmptyCornerPoints(to: &result)
    }

    return result
  }

  static func cornerPoints(from points: [CGPoint]) -> [[String: Any]] {
    points.map { ["x": $0.x, "y": $0.y] }
  }

  static func bounds(from rect: CGRect) -> [String: Any] {
    [
      "origin": ["x": rect.origin.x, "y": rect.origin.y],
      "size": ["width": rect.size.width, "height": rect.size.height]
    ]
  }

  public static func addEmptyCornerPoints(to result: inout [String: Any]) {
    result["cornerPoints"] = []
    result["bounds"] = bounds(from: .zero)
  }
}
