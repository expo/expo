import AVFoundation
import CoreImage

class MetaDataDelegate: NSObject, AVCaptureMetadataOutputObjectsDelegate, AVCaptureVideoDataOutputSampleBufferDelegate {
  private var settings: [String: [AVMetadataObject.ObjectType]]
  private var previewLayer: AVCaptureVideoPreviewLayer?
  private let barcodeProvider: ExpoBarcodeScannerProvider
  private var barcodeProviderEnabled = true
  private var barcodeProviderFPSProcessed = 6.0
  private var lastFrameTimeStamp = 0.0
  private let responseHandler: BarcodeScanningResponseHandler

  private let ciContext = CIContext()

  init(
    settings: [String: [AVMetadataObject.ObjectType]],
    previewLayer: AVCaptureVideoPreviewLayer?,
    barcodeProvider: ExpoBarcodeScannerProvider,
    barcodeProviderEnabled: Bool,
    metadataResultHandler: BarcodeScanningResponseHandler
  ) {
    self.settings = settings
    self.previewLayer = previewLayer
    self.barcodeProviderEnabled = barcodeProviderEnabled
    self.responseHandler = metadataResultHandler
    self.barcodeProvider = barcodeProvider
  }

  func updateSettings(_ settings: [String: [AVMetadataObject.ObjectType]], barcodeProviderEnabled: Bool) {
    self.settings = settings
    self.barcodeProviderEnabled = barcodeProviderEnabled
  }

  func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
    guard let settings = settings[BARCODE_TYPES_KEY] else {
      return
    }

    let barcodeProviderTypes = Set(barcodeProvider.supportedTypes)

    for metadata in metadataObjects {
      var codeMetadata = metadata as? AVMetadataMachineReadableCodeObject
      if let previewLayer {
        codeMetadata = previewLayer.transformedMetadataObject(for: metadata) as? AVMetadataMachineReadableCodeObject
      }

      for barcodeType in settings {
        // Skip types handled by the barcode provider — those come through captureOutput instead
        if barcodeProviderTypes.contains(barcodeType.rawValue) {
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
    guard barcodeProviderEnabled else {
      return
    }

    let kMinMargin = 1.0 / barcodeProviderFPSProcessed
    let presentTimeStamp = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
    let curFrameTimeStamp = Double(presentTimeStamp.value) / Double(presentTimeStamp.timescale)

    if curFrameTimeStamp - lastFrameTimeStamp > kMinMargin {
      lastFrameTimeStamp = curFrameTimeStamp

      if let videoFrame = CMSampleBufferGetImageBuffer(sampleBuffer),
         let image = createImage(from: videoFrame) {
        for result in barcodeProvider.scanBarcodes(from: image) {
          self.responseHandler.onScanningResult(result)
        }
      }
    }
  }

  private func createImage(from buffer: CVImageBuffer) -> CGImage? {
    let ciImage = CIImage(cvImageBuffer: buffer)
    return ciContext.createCGImage(ciImage, from: ciImage.extent)
  }
}
