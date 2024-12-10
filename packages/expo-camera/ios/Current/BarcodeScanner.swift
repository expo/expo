import ZXingObjC
import AVFoundation

let BARCODE_TYPES_KEY = "barcodeTypes"

actor BarcodeScanner: NSObject, BarcodeScanningResponseHandler {
  private var onBarcodeScanned: (([String: Any]?) -> Void)?
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
  private var previewLayer: AVCaptureVideoPreviewLayer?
  private var zxingEnabled = true
  private var delegate: MetaDataDelegate?

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
        Task {
          await maybeStartBarcodeScanning()
        }
      }
    }
  }

  func setPreviewLayer(layer: AVCaptureVideoPreviewLayer) {
    self.previewLayer = layer
  }

  func setIsEnabled(_ enabled: Bool) async {
    guard isScanningBarcodes != enabled else {
      return
    }

    isScanningBarcodes = enabled
    if isScanningBarcodes {
      if metadataOutput != nil {
        setConnection(enabled: true)
      } else {
        await maybeStartBarcodeScanning()
      }
    } else {
      setConnection(enabled: false)
      await stopBarcodeScanning()
    }
  }

  func setConnection(enabled: Bool) {
    metadataOutput?.connections.forEach {
      $0.isEnabled = enabled
    }
  }

  func setOnBarcodeScanned(_ onBarcodeScanned: @escaping ([String: Any]?) -> Void) {
    self.onBarcodeScanned = onBarcodeScanned
  }

  func maybeStartBarcodeScanning() async {
    guard isScanningBarcodes else {
      return
    }

    if metadataOutput == nil || videoDataOutput == nil {
      await addOutputs()
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

  func stopBarcodeScanning() async {
    await removeOutputs()
    if isScanningBarcodes {
      onBarcodeScanned?(nil)
    }
  }

  private func addOutputs() async {
    session.beginConfiguration()
    defer { session.commitConfiguration() }

    delegate = MetaDataDelegate(
      settings: settings,
      previewLayer: previewLayer,
      zxingBarcodeReaders: zxingBarcodeReaders,
      zxingEnabled: zxingEnabled,
      metadataResultHandler: self)

    if metadataOutput == nil {
      let output = AVCaptureMetadataOutput()
      output.setMetadataObjectsDelegate(delegate, queue: sessionQueue)
      if session.canAddOutput(output) {
        session.addOutput(output)
        metadataOutput = output
      }
    }

    if videoDataOutput == nil {
      let output = AVCaptureVideoDataOutput()
      output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
      output.alwaysDiscardsLateVideoFrames = true
      output.setSampleBufferDelegate(delegate, queue: zxingCaptureQueue)
      if session.canAddOutput(output) {
        session.addOutput(output)
        videoDataOutput = output
      }
    }
  }

  private func removeOutputs() async {
    session.beginConfiguration()
    defer { session.commitConfiguration() }

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
  }

  func onScanningResult(_ result: [String: Any]) {
    self.onBarcodeScanned?(result)
  }
}
