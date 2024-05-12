import ExpoModulesCore
import Vision

struct BarcodeSettings: Record {
  @Field var barcodeTypes: [BarcodeType]

  func toMetadataObjectType() -> [AVMetadataObject.ObjectType] {
    barcodeTypes.map {
      $0.toMetadataObjectType()
    }
  }
}

enum BarcodeType: String, Enumerable {
  case aztec
  case ean13
  case ean8
  case qr
  case pdf417
  case upc_e
  case datamatrix
  case code39
  case code93
  case itf14
  case codabar
  case code128
  case upc_a

  func toMetadataObjectType() -> AVMetadataObject.ObjectType {
    if #available(iOS 15.4, *) {
      if self == .codabar {
        return .codabar
      }
    }
    switch self {
    case .aztec:
      return .aztec
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
    case .upc_a:
      return .ean13
    case .upc_e:
      return .upce
    case .code39:
      return .code39
    case .code93:
      return .code93
    case .datamatrix:
      return .dataMatrix
    case .code128:
      return .code128
    default:
      return .aztec
    }
  }
}

enum VNBarcodeType: String, Enumerable {
  case aztec
  case ean13
  case ean8
  case qr
  case pdf417
  case upc_e
  case datamatrix
  case code39
  case code93
  case itf14
  case codabar
  case code128
  case upc_a

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
    case .upc_a:
      return .ean13
    case .upc_e:
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
  @Field var barcodeTypes: [VNBarcodeType] = []
  @Field var isPinchToZoomEnabled: Bool = false
  @Field var isGuidanceEnabled: Bool = true
  @Field var isHighlightingEnabled: Bool = false

  @available(iOS 16.0, *)
  func toSymbology() -> [VNBarcodeSymbology] {
    barcodeTypes.map {
      $0.toSymbology()
    }
  }
}
