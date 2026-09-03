import AVFoundation

let BARCODE_TYPES_KEY = "barcodeTypes"

class BarcodeScanner: NSObject, BarcodeScanningResponseHandler {
  private var onBarcodeScanned: (([String: Any]?) -> Void)?
  var isScanningBarcodes = false

  // MARK: - Properties

  private let session: AVCaptureSession
  private let sessionQueue: DispatchQueue
  private let captureQueue = DispatchQueue(label: "com.expo.barcodeScannerCaptureQueue")

  private var metadataOutput: AVCaptureMetadataOutput?
  private var videoDataOutput: AVCaptureVideoDataOutput?
  private var settings = BarcodeScannerUtils.getDefaultSettings()
  private var previewLayer: AVCaptureVideoPreviewLayer?
  private var barcodeProviderEnabled = true
  private var delegate: MetaDataDelegate?

  private let barcodeProvider: ExpoBarcodeScannerProvider?

  init(
    session: AVCaptureSession,
    sessionQueue: DispatchQueue,
    provider: ExpoBarcodeScannerProvider? = BarcodeScanner.discoverProvider()
  ) {
    self.session = session
    self.sessionQueue = sessionQueue
    self.barcodeProvider = provider
  }

  /// Discovers the optional barcode scanner provider at runtime.
  /// The provider module registers by exposing a class named "ExpoCameraZXingProvider"
  /// that conforms to ExpoBarcodeScannerProvider. Returns nil if the provider pod isn't linked.
  static func discoverProvider() -> ExpoBarcodeScannerProvider? {
    guard let cls = NSClassFromString("ExpoCameraZXingProvider") as? NSObject.Type,
          let instance = cls.init() as? ExpoBarcodeScannerProvider else {
      return nil
    }
    return instance
  }

  func setSettings(_ newSettings: [String: [AVMetadataObject.ObjectType]]) {
    for (key, value) in newSettings where key == BARCODE_TYPES_KEY {
      let augmentedValue = BarcodeScannerUtils.augmentedBarcodeTypes(value)
      let previousTypes = Set(settings[BARCODE_TYPES_KEY] ?? [])
      let newTypes = Set(augmentedValue)
      if previousTypes != newTypes {
        settings[BARCODE_TYPES_KEY] = augmentedValue
        if let barcodeProvider {
          let supportedTypeSet = Set(barcodeProvider.supportedTypes)
          let requestedRawValues = Set(newTypes.map { $0.rawValue })
          barcodeProviderEnabled = !supportedTypeSet.isDisjoint(with: requestedRawValues)
        } else {
          barcodeProviderEnabled = false
        }
        delegate?.updateSettings(settings, barcodeProviderEnabled: barcodeProviderEnabled)
        maybeStartBarcodeScanning()
      }
    }
  }

  func setPreviewLayer(layer: AVCaptureVideoPreviewLayer) {
    self.previewLayer = layer
  }

  func setIsEnabled(_ enabled: Bool) {
    guard isScanningBarcodes != enabled else {
      return
    }

    isScanningBarcodes = enabled
    if isScanningBarcodes {
      if metadataOutput != nil {
        setConnection(enabled: true)
      } else {
        maybeStartBarcodeScanning()
      }
    } else {
      setConnection(enabled: false)
      stopBarcodeScanning()
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

  func maybeStartBarcodeScanning() {
    guard isScanningBarcodes else {
      return
    }

    // A session can accept the metadata output while rejecting the video data output, which
    // conflicts with the movie file output used in video mode. Keep retrying until the provider
    // has its frame source, otherwise the types it claims scan nothing.
    if metadataOutput == nil || (barcodeProvider != nil && videoDataOutput == nil) {
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

  private func addOutputs() {
    let delegate = delegate ?? MetaDataDelegate(
      settings: settings,
      previewLayer: previewLayer,
      barcodeProvider: barcodeProvider,
      barcodeProviderEnabled: barcodeProviderEnabled,
      metadataResultHandler: self)
    self.delegate = delegate

    session.beginConfiguration()
    if metadataOutput == nil {
      let output = AVCaptureMetadataOutput()
      output.setMetadataObjectsDelegate(delegate, queue: sessionQueue)
      if session.canAddOutput(output) {
        session.addOutput(output)
        metadataOutput = output
      }
    }

    if barcodeProvider != nil && videoDataOutput == nil {
      let output = AVCaptureVideoDataOutput()
      output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
      output.alwaysDiscardsLateVideoFrames = true
      output.setSampleBufferDelegate(delegate, queue: captureQueue)
      if session.canAddOutput(output) {
        session.addOutput(output)
        videoDataOutput = output
      }
    }
    session.commitConfiguration()
  }

  private func removeOutputs() {
    session.beginConfiguration()
    defer {
      session.commitConfiguration()
      delegate = nil
    }

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
