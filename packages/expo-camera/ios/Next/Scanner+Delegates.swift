import AVFoundation
import ZXingObjC

extension BarcodeScanner: AVCaptureMetadataOutputObjectsDelegate, AVCaptureVideoDataOutputSampleBufferDelegate {
  func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
    guard let settings = settings[BARCODE_TYPES_KEY], let metadataOutput else {
      return
    }

    for metadata in metadataObjects {
      let codeMetadata = metadata as? AVMetadataMachineReadableCodeObject
      for barcodeType in settings {
        if zxingBarcodeReaders[barcodeType] != nil {
          continue
        }

        if let codeMetadata {
          if codeMetadata.stringValue != nil && codeMetadata.type == barcodeType {
            onBarcodeScanned?(BarcodeScannerUtils.avMetadataCodeObjectToDictionary(codeMetadata))
          }
        }
      }
    }
  }

  func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
    guard let barCodeTypes = settings[BARCODE_TYPES_KEY],
      let metadataOutput,
      zxingEnabled else {
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
        self.scanBarcodes(from: videoFrameImage) { barCodeScannerResult in
          self.onBarcodeScanned?(BarcodeScannerUtils.zxResultToDictionary(barCodeScannerResult))
        }
      }
    }
  }
}
