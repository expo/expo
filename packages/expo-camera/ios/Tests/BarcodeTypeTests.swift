import Testing
import AVFoundation

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
}
