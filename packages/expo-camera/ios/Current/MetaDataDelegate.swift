import ZXingObjC

protocol BarcodeScanningResponseHandler {
  func onScanningResult(_ result: [String: Any])
}

class MetaDataDelegate: NSObject, AVCaptureMetadataOutputObjectsDelegate, AVCaptureVideoDataOutputSampleBufferDelegate {
  private var settings: [String: [AVMetadataObject.ObjectType]]
  private var previewLayer: AVCaptureVideoPreviewLayer?
  private var zxingBarcodeReaders: [AVMetadataObject.ObjectType: ZXReader]
  private var zxingEnabled = true
  private var zxingFPSProcessed = 6.0
  private let responseHandler: BarcodeScanningResponseHandler

  init(
    settings: [String: [AVMetadataObject.ObjectType]],
    previewLayer: AVCaptureVideoPreviewLayer?,
    zxingBarcodeReaders: [AVMetadataObject.ObjectType: ZXReader],
    zxingEnabled: Bool,
    metadataResultHandler: BarcodeScanningResponseHandler
  ) {
    self.settings = settings
    self.previewLayer = previewLayer
    self.zxingEnabled = zxingEnabled
    self.responseHandler = metadataResultHandler
    self.zxingBarcodeReaders = zxingBarcodeReaders
  }

  func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
    guard let settings = settings[BARCODE_TYPES_KEY] else {
      return
    }

    for metadata in metadataObjects {
      var codeMetadata = metadata as? AVMetadataMachineReadableCodeObject
      if let previewLayer {
        codeMetadata = previewLayer.transformedMetadataObject(for: metadata) as? AVMetadataMachineReadableCodeObject
      }

      for barcodeType in settings {
        if zxingBarcodeReaders[barcodeType] != nil {
          continue
        }

        if let codeMetadata {
          if codeMetadata.stringValue != nil && codeMetadata.type == barcodeType {
            self.responseHandler.onScanningResult(BarcodeScannerUtils.avMetadataCodeObjectToDictionary(codeMetadata))
          }
        }
      }
    }
  }

  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    guard zxingEnabled else {
      return
    }

    let kMinMargin = 1.0 / zxingFPSProcessed
    let presentTimeStamp = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)

    var curFrameTimeStamp = 0.0
    var lastFrameTimeStamp = 0.0

    curFrameTimeStamp = Double(presentTimeStamp.value) / Double(presentTimeStamp.timescale)

    if curFrameTimeStamp - lastFrameTimeStamp > Double(kMinMargin) {
      lastFrameTimeStamp = curFrameTimeStamp

      if let videoFrame = CMSampleBufferGetImageBuffer(sampleBuffer),
      let videoFrameImage = ZXCGImageLuminanceSource.createImage(from: videoFrame) {
        self.scanBarcodes(from: videoFrameImage) { barcodeScannerResult in
          self.responseHandler.onScanningResult(BarcodeScannerUtils.zxResultToDictionary(barcodeScannerResult))
        }
      }
    }
  }

  func scanBarcodes(from image: CGImage, completion: @escaping (ZXResult) -> Void) {
    let source = ZXCGImageLuminanceSource(cgImage: image)
    let binarizer = ZXHybridBinarizer(source: source)
    let bitmap = ZXBinaryBitmap(binarizer: binarizer)

    var result: ZXResult?

    for reader in zxingBarcodeReaders.values {
      result = try? reader.decode(bitmap, hints: nil)
      if result != nil {
        break
      }
    }

    if result == nil && bitmap?.rotateSupported == true {
      if let rotatedBitmap = bitmap?.rotateCounterClockwise() {
        for reader in zxingBarcodeReaders.values {
          result = try? reader.decode(rotatedBitmap, hints: nil)
          if result != nil {
            break
          }
        }
      }
    }

    if let result {
      completion(result)
    }
  }
}
