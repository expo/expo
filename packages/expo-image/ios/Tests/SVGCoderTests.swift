import Foundation
import Testing

internal import SDWebImage

@testable import ExpoImage

private let withVariables = Data(##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="var(--a, red)"/></svg>"##.utf8)
private let withoutVariables = Data(##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="red"/></svg>"##.utf8)

@Suite("SVG coder")
struct SVGCoderTests {
  @Test
  func `attaches the original document to an image that uses var()`() {
    let image = SVGCoder.shared.decodedImage(with: withVariables, options: nil)
    #expect(image != nil)
    #expect(image?.sd_extendedObject as? Data == withVariables)
  }

  @Test
  func `attaches nothing to an image without var()`() {
    let image = SVGCoder.shared.decodedImage(with: withoutVariables, options: nil)
    #expect(image != nil)
    #expect(image?.sd_extendedObject == nil)
  }

  @Test
  func `tags the image as an SVG`() {
    #expect(SVGCoder.shared.decodedImage(with: withVariables, options: nil)?.sd_imageFormat == .SVG)
  }
}
