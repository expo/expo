import Testing

@testable import ExpoLocation

@Suite("AddressNormalization")
struct AddressNormalizationTests {
  @Test(arguments: [
    ("", nil),
    (nil, nil),
    ("Kraków", "Kraków"),
    (" ", nil),
    ("\n", nil),
    ("  Kraków \n", "  Kraków \n"),
  ] as [(String?, String?)])
  func `normalizes blank address strings to nil`(value: String?, expected: String?) {
    #expect(normalizeAddressString(value) == expected)
  }
}
