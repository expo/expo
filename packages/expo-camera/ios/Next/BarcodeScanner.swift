import ZXingObjC
import AVFoundation

let BARCODE_TYPES_KEY = "barCodeTypes"

class BarcodeScanner: NSObject {
  var onBarcodeScanned: (([String: Any]?) -> Void)?
  var isScanningBarcodes = false

  // MARK: - Properties

  private let session: AVCaptureSession
  private let sessionQueue: DispatchQueue
  private let zxingCaptureQueue = DispatchQueue(label: "com.zxing.captureQueue")

  internal var metadataOutput: AVCaptureMetadataOutput?
  internal var videoDataOutput: AVCaptureVideoDataOutput?
  internal var settings = BarcodeScannerUtils.getDefaultSettings()
  internal var zxingBarcodeReaders: [AVMetadataObject.ObjectType: ZXReader] = [
    AVMetadataObject.ObjectType.pdf417: ZXPDF417Reader(),
    AVMetadataObject.ObjectType.code39: ZXCode39Reader()
  ]

  internal var zxingFPSProcessed = 6.0
  internal var zxingEnabled = true

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
    metadataOutput?.connections.forEach {
      $0.isEnabled = enabled
    }
  }

  func maybeStartBarCodeScanning() {
    guard isScanningBarcodes else {
      return
    }

    if metadataOutput == nil || videoDataOutput == nil {
      addOutputs()
      if metadataOutput == nil {
        return
      }
    }

    var availableRequestedObjectTypes: [AVMetadataObject.ObjectType] = []
    let availableObjectTypes: [AVMetadataObject.ObjectType] = metadataOutput?.availableMetadataObjectTypes ?? []

    for type in settings[BARCODE_TYPES_KEY] ?? [] where availableObjectTypes.contains(type) {
      availableRequestedObjectTypes.append(type)
    }

    metadataOutput?.metadataObjectTypes = availableRequestedObjectTypes
  }

  func stopBarCodeScanning() {
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
}
