import Testing
import AVFoundation
import Vision

@testable import ExpoCamera

@Suite("BarcodeType")
struct BarcodeTypeTests {
  @Test(arguments: [
    (AVMetadataObject.ObjectType.aztec, BarcodeType.aztec),
    (.qr, .qr),
    (.ean13, .ean13),
    (.ean8, .ean8),
    (.pdf417, .pdf417),
    (.itf14, .itf14),
    (.interleaved2of5, .itf14),
    (.upce, .upc_e),
    (.code39, .code39),
    (.code93, .code93),
    (.dataMatrix, .datamatrix),
    (.code128, .code128),
    (.codabar, .codabar),
  ] as [(AVMetadataObject.ObjectType, BarcodeType)])
  func `maps AVFoundation object types to expo barcode types`(
    type: AVMetadataObject.ObjectType,
    expected: BarcodeType
  ) {
    #expect(BarcodeType.toBarcodeType(type: type) == expected)
  }

  @Test
  func `unknown object types fall back to aztec`() {
    #expect(BarcodeType.toBarcodeType(type: .face) == .aztec)
  }

  @Test(arguments: [
    (BarcodeType.aztec, AVMetadataObject.ObjectType.aztec),
    (.qr, .qr),
    (.ean13, .ean13),
    (.ean8, .ean8),
    (.pdf417, .pdf417),
    (.itf14, .itf14),
    (.upc_a, .ean13),
    (.upc_e, .upce),
    (.code39, .code39),
    (.code93, .code93),
    (.datamatrix, .dataMatrix),
    (.code128, .code128),
    (.codabar, .codabar),
  ] as [(BarcodeType, AVMetadataObject.ObjectType)])
  func `maps expo barcode types to AVFoundation object types`(
    barcodeType: BarcodeType,
    expected: AVMetadataObject.ObjectType
  ) {
    #expect(barcodeType.toMetadataObjectType() == expected)
  }

  @available(iOS 16.0, *)
  @Test
  func `maps expo barcode types to Vision symbologies`() {
    #expect(VNBarcodeType.upc_a.toSymbology() == .ean13)
    #expect(VNBarcodeType.upc_e.toSymbology() == .upce)
    #expect(VNBarcodeType.datamatrix.toSymbology() == .dataMatrix)
    #expect(VNBarcodeType.codabar.toSymbology() == .codabar)
    #expect(VNBarcodeType.qr.toSymbology() == .qr)
    #expect(VNBarcodeType.itf14.toSymbology() == .itf14)
  }
}
