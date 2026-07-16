import Testing

@testable import ExpoCamera

@Suite("BarcodeScannerUtils.normalizeBarcodeValue")
struct BarcodeScannerUtilsTests {
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
