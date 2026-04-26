import AVFoundation
internal import ZXingObjC
import ExpoCamera

@objc(ExpoCameraZXingProvider)
class ExpoCameraZXingProvider: NSObject, ExpoBarcodeScannerProvider {
  private var readers: [String: ZXReader] = [:]

  override init() {
    super.init()
    readers[AVMetadataObject.ObjectType.pdf417.rawValue] = ZXPDF417Reader()
    readers[AVMetadataObject.ObjectType.code39.rawValue] = ZXCode39Reader()
    if #available(iOS 15.4, *) {
      readers[AVMetadataObject.ObjectType.codabar.rawValue] = ZXCodaBarReader()
    }
  }

  var supportedTypes: [String] {
    Array(readers.keys)
  }

  func scanBarcodes(from image: CGImage) -> [[String: Any]] {
    let source = ZXCGImageLuminanceSource(cgImage: image)
    let binarizer = ZXHybridBinarizer(source: source)
    let bitmap = ZXBinaryBitmap(binarizer: binarizer)

    for (type, reader) in readers {
      if let result = try? reader.decode(bitmap, hints: nil) {
        return [["type": type, "data": result.text.filter { $0 != "\0" }]]
      }
    }

    // Retry with rotated image for barcodes at non-standard orientations
    if bitmap?.rotateSupported == true, let rotated = bitmap?.rotateCounterClockwise() {
      for (type, reader) in readers {
        if let result = try? reader.decode(rotated, hints: nil) {
          return [["type": type, "data": result.text.filter { $0 != "\0" }]]
        }
      }
    }

    return []
  }
}
