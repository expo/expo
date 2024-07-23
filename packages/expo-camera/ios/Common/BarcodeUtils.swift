import AVFoundation

struct BarcodeUtils {
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
      result["cornerPoints"] = [
        codeFeature.topLeft,
        codeFeature.topRight,
        codeFeature.bottomRight,
        codeFeature.bottomLeft
      ].map { point in
        [
          "x": point.x,
          "y": point.y
        ]
      }

      let origin = codeFeature.bounds.origin
      let size = codeFeature.bounds.size

      result["bounds"] = [
        "origin": [
          "x": origin.x,
          "y": origin.y
        ],
        "size": [
          "width": size.width,
          "height": size.height
        ]
      ]
    } else {
      addEmptyCornerPoints(to: &result)
    }

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
}
