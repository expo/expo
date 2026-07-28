import Testing
import AVFoundation

@testable import ExpoCamera

@Suite("BarcodeScannerUtils")
struct BarcodeScannerUtilsTests {
  @Test
  func `registers interleaved2of5 alongside itf14 to match ML Kit FORMAT_ITF`() {
    #expect(BarcodeScannerUtils.augmentedBarcodeTypes([.itf14]) == [.itf14, .interleaved2of5])
  }

  @Test
  func `does not duplicate interleaved2of5 when already requested`() {
    let types: [AVMetadataObject.ObjectType] = [.itf14, .interleaved2of5]
    #expect(BarcodeScannerUtils.augmentedBarcodeTypes(types) == types)
  }

  @Test
  func `leaves types without itf14 unchanged`() {
    #expect(BarcodeScannerUtils.augmentedBarcodeTypes([.qr, .ean13]) == [.qr, .ean13])
  }

  @Test
  func `drops the leading zero iOS adds when reporting upc_a as ean13`() {
    #expect(BarcodeScannerUtils.normalizeBarcodeValue("0123456789012", isEAN13: true) == "123456789012")
  }

  @Test
  func `keeps a genuine ean13 value that does not start with zero`() {
    #expect(BarcodeScannerUtils.normalizeBarcodeValue("4006381333931", isEAN13: true) == "4006381333931")
  }

  @Test
  func `keeps a leading zero when the value is not ean13`() {
    #expect(BarcodeScannerUtils.normalizeBarcodeValue("0123", isEAN13: false) == "0123")
  }

  @Test
  func `passes nil through`() {
    #expect(BarcodeScannerUtils.normalizeBarcodeValue(nil, isEAN13: true) == nil)
  }

  @Test
  func `passes an empty ean13 value through`() {
    #expect(BarcodeScannerUtils.normalizeBarcodeValue("", isEAN13: true) == "")
  }
}
