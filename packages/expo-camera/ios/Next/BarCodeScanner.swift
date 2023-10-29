import ZXingObjC
import AVFoundation

class BarCodeScanner: NSObject, AVCaptureMetadataOutputObjectsDelegate, AVCaptureVideoDataOutputSampleBufferDelegate {
  var session: AVCaptureSession
  var sessionQueue: DispatchQueue
  var onBarCodeScanned: (([String: Any]?) -> Void)?
  var isScanningBarcodes = false

  private var metadataOutput: AVCaptureMetadataOutput?
  private var videoDataOutput: AVCaptureVideoDataOutput?

  private var settings: [String: [AVMetadataObject.ObjectType]] = BarCodeScannerUtils.getDefaultSettings()
  private var zxingBarcodeReaders: [AVMetadataObject.ObjectType: ZXReader] = [
    AVMetadataObject.ObjectType.pdf417: ZXPDF417Reader(),
    AVMetadataObject.ObjectType.code39: ZXCode39Reader()
  ]

  private let BARCODE_TYPES_KEY = "barCodeTypes"
  private var zxingFPSProcessed =  6.0
  private var zxingCaptureQueue = DispatchQueue(label: "com.zxing.captureQueue")
  private var zxingEnabled = true

  init(session: AVCaptureSession, sessionQueue: DispatchQueue) {
    self.session = session
    self.sessionQueue = sessionQueue

    if #available(iOS 15.4, *) {
      zxingBarcodeReaders[AVMetadataObject.ObjectType.codabar] = ZXCodaBarReader()
    }

    super.init()
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
          self.maybeStartBarCodeScanning()
        }
      }
    }
  }

  func setIsEnabled(_ newBarCodeScanning: Bool) {
    guard isScanningBarcodes != newBarCodeScanning else {
      return
    }

    isScanningBarcodes = newBarCodeScanning
    sessionQueue.async {
      if self.isScanningBarcodes {
        if self.metadataOutput != nil {
          self.setConnection(enabled: true)
        } else {
          self.maybeStartBarCodeScanning()
        }
      } else {
        self.setConnection(enabled: false)
      }
    }
  }

  func setConnection(enabled: Bool) {
    guard let metadataOutput else {
      return
    }

    for connection in metadataOutput.connections {
      connection.isEnabled = enabled
    }
  }

  func maybeStartBarCodeScanning() {
    guard isScanningBarcodes else {
      return
    }

    if metadataOutput == nil || videoDataOutput == nil {
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

      if metadataOutput == nil {
        return
      }
    }

    var availableRequestedObjectTypes: [AVMetadataObject.ObjectType] = []
    let requestedObjectTypes = settings[BARCODE_TYPES_KEY] ?? []
    let availableObjectTypes: [AVMetadataObject.ObjectType] = metadataOutput?.availableMetadataObjectTypes ?? []

    for type in requestedObjectTypes where availableObjectTypes.contains(type) {
      availableRequestedObjectTypes.append(type)
    }

    metadataOutput?.metadataObjectTypes = availableRequestedObjectTypes
  }

  func stopBarCodeScanning() {
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

    if isScanningBarcodes {
      onBarCodeScanned?(nil)
    }
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
            onBarCodeScanned?(BarCodeScannerUtils.avMetadataCodeObjectToDictionary(codeMetadata))
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
          self.onBarCodeScanned?(BarCodeScannerUtils.zxResultToDictionary(barCodeScannerResult))
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
  
  deinit {
    print("Scanner deallocating")
  }
}
