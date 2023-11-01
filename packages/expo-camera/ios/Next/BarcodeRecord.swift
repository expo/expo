import ExpoModulesCore
import Vision

struct BarcodeSettings: Record {
  @Field var interval: Double?
  @Field var barCodeTypes: [String]

  func toMetadataObjectType() -> [AVMetadataObject.ObjectType] {
    barCodeTypes.map {
      AVMetadataObject.ObjectType(rawValue: $0)
    }
  }
}

enum VNBarcodeType: String, Enumerable {
  case aztec
  case ean13
  case ean8
  case qr
  case pdf417
  case upce
  case datamatrix
  case code39
  case code93
  case itf14
  case codabar
  case code128
  case upca

  @available(iOS 16.0, *)
  func toSymbology() -> VNBarcodeSymbology {
    switch self {
    case .aztec:
      return .aztec
    case .codabar:
      return .codabar
    case .qr:
      return .qr
    case .ean13:
      return .ean13
    case .ean8:
      return .ean8
    case .pdf417:
      return .pdf417
    case .itf14:
      return .itf14
    case .upca:
      return .upce
    case .upce:
      return .upce
    case .code39:
      return .code39
    case .code93:
      return .code93
    case .datamatrix:
      return .dataMatrix
    case .code128:
      return .code128
    }
  }
}

struct VisionScannerOptions: Record {
  @Field var barCodeTypes: [VNBarcodeType] = []
  @Field var isPinchToZoomEnabled: Bool = false
  @Field var isGuidanceEnabled: Bool = true
  @Field var isHighlightingEnabled: Bool = false

  @available(iOS 16.0, *)
  func toSymbology() -> [VNBarcodeSymbology] {
    barCodeTypes.map {
      $0.toSymbology()
    }
  }
}
