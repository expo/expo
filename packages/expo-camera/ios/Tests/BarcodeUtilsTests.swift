import Testing
import CoreGraphics

@testable import ExpoCamera

@Suite("BarcodeUtils")
struct BarcodeUtilsTests {
  @Test
  func `maps points to x and y dictionaries in order`() {
    let points = BarcodeUtils.cornerPoints(from: [CGPoint(x: 1, y: 2), CGPoint(x: 3, y: 4)])

    #expect(points.count == 2)
    #expect(points[0]["x"] as? CGFloat == 1)
    #expect(points[0]["y"] as? CGFloat == 2)
    #expect(points[1]["x"] as? CGFloat == 3)
    #expect(points[1]["y"] as? CGFloat == 4)
  }

  @Test
  func `maps a rect to an origin and size bounds dictionary`() {
    let bounds = BarcodeUtils.bounds(from: CGRect(x: 1, y: 2, width: 3, height: 4))

    let origin = try? #require(bounds["origin"] as? [String: Any])
    let size = try? #require(bounds["size"] as? [String: Any])
    #expect(origin?["x"] as? CGFloat == 1)
    #expect(origin?["y"] as? CGFloat == 2)
    #expect(size?["width"] as? CGFloat == 3)
    #expect(size?["height"] as? CGFloat == 4)
  }

  @Test
  func `empty corner points produce a zeroed bounds and empty corners`() throws {
    var result: [String: Any] = [:]
    BarcodeUtils.addEmptyCornerPoints(to: &result)

    #expect((result["cornerPoints"] as? [Any])?.isEmpty == true)

    let bounds = try #require(result["bounds"] as? [String: Any])
    let origin = try #require(bounds["origin"] as? [String: Any])
    let size = try #require(bounds["size"] as? [String: Any])
    #expect(origin["x"] as? CGFloat == 0)
    #expect(origin["y"] as? CGFloat == 0)
    #expect(size["width"] as? CGFloat == 0)
    #expect(size["height"] as? CGFloat == 0)
  }
}
