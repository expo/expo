import ZXingObjC
import AVFoundation

let BARCODE_TYPES_KEY = "barcodeTypes"

class BarcodeScanner: NSObject, AVCaptureMetadataOutputObjectsDelegate, AVCaptureVideoDataOutputSampleBufferDelegate {
  var onBarcodeScanned: (([String: Any]?) -> Void)?
  var isScanningBarcodes = false

  // MARK: - Properties

  private let session: AVCaptureSession
  private let sessionQueue: DispatchQueue
  private let zxingCaptureQueue = DispatchQueue(label: "com.zxing.captureQueue")

  private var metadataOutput: AVCaptureMetadataOutput?
  private var videoDataOutput: AVCaptureVideoDataOutput?
  private var settings = BarcodeScannerUtils.getDefaultSettings()
  private var zxingBarcodeReaders: [AVMetadataObject.ObjectType: ZXReader] = [
    AVMetadataObject.ObjectType.pdf417: ZXPDF417Reader(),
    AVMetadataObject.ObjectType.code39: ZXCode39Reader()
  ]

  private var zxingFPSProcessed = 6.0
  private var zxingEnabled = true

  init(session: AVCaptureSession, sessionQueue: DispatchQueue) {
    self.session = session
    self.sessionQueue = sessionQueue

    if #available(iOS 15.4, *) {
      zxingBarcodeReaders[AVMetadataObject.ObjectType.codabar] = ZXCodaBarReader()
    }
  }

  func setSettings(_ newSettings: [String: [AVMetadataObject.ObjectType]]) {
    for (key, value) in newSettings where key == BARCODE_TYPES_KEY {
      let previousTypes = Set(settings[BARCODE_TYPES_KEY] ?? [])
      let newTypes = Set(value)
      if previousTypes != newTypes {
        settings[BARCODE_TYPES_KEY] = value
        let zxingCoveredTypes = Set(zxingBarcodeReaders.keys)
        zxingEnabled = !zxingCoveredTypes.isDisjoint(with: newTypes)
        sessionQueue.async {
          self.maybeStartBarcodeScanning()
        }
      }
    }
  }

  func setIsEnabled(_ enabled: Bool) {
    guard isScanningBarcodes != enabled else {
      return
    }

    isScanningBarcodes = enabled
    sessionQueue.async {
      if self.isScanningBarcodes {
        if self.metadataOutput != nil {
          self.setConnection(enabled: true)
        } else {
          self.maybeStartBarcodeScanning()
        }
      } else {
        self.setConnection(enabled: false)
      }
    }
  }

  func setConnection(enabled: Bool) {
    metadataOutput?.connections.forEach {
      $0.isEnabled = enabled
    }
  }

  func maybeStartBarcodeScanning() {
    guard isScanningBarcodes else {
      return
    }

    if metadataOutput == nil || videoDataOutput == nil {
      addOutputs()
      if metadataOutput == nil {
        return
      }
    }

    let availableObjectTypes: [AVMetadataObject.ObjectType] = metadataOutput?.availableMetadataObjectTypes ?? []
    let requestedTypes = (settings[BARCODE_TYPES_KEY] ?? []).filter {
      availableObjectTypes.contains($0)
    }

    metadataOutput?.metadataObjectTypes = requestedTypes
  }

  func stopBarcodeScanning() {
    removeOutputs()
    if isScanningBarcodes {
      onBarcodeScanned?(nil)
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

  private func addOutputs() {
    session.beginConfiguration()

    if metadataOutput == nil {
      let output = AVCaptureMetadataOutput()
      output.setMetadataObjectsDelegate(self, queue: sessionQueue)
      if session.canAddOutput(output) {
        session.addOutput(output)
        metadataOutput = output
      }
    }

    if videoDataOutput == nil {
      let output = AVCaptureVideoDataOutput()
      output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
      output.alwaysDiscardsLateVideoFrames = true
      output.setSampleBufferDelegate(self, queue: zxingCaptureQueue)
      if session.canAddOutput(output) {
        session.addOutput(output)
        videoDataOutput = output
      }
    }

    session.commitConfiguration()
  }

  private func removeOutputs() {
    session.beginConfiguration()

    if let metadataOutput {
      if session.outputs.contains(metadataOutput) {
        session.removeOutput(metadataOutput)
        self.metadataOutput = nil
      }
    }

    if let videoDataOutput {
      if session.outputs.contains(videoDataOutput) {
        session.removeOutput(videoDataOutput)
        self.videoDataOutput = nil
      }
    }

    session.commitConfiguration()
  }

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
    guard let barcodeTypes = settings[BARCODE_TYPES_KEY],
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
        self.scanBarcodes(from: videoFrameImage) { barcodeScannerResult in
          self.onBarcodeScanned?(BarcodeScannerUtils.zxResultToDictionary(barcodeScannerResult))
        }
      }
    }
  }
}
