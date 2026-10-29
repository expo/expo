import CoreGraphics
import Testing

@testable import EXDevMenu

@Suite("FAB placement ranges")
struct FABPlacementTests {
  private let bounds = CGSize(width: 393, height: 852)
  private let inset: CGFloat = 10
  private let ring = FABPlacement.ringOverhang

  private let notch = FABInsets(top: 59, leading: 0, bottom: 34, trailing: 0)
  private let flat = FABInsets(top: 0, leading: 0, bottom: 0, trailing: 0)

  private func centredPill(height: CGFloat) -> CGRect {
    let width = 44 + ring * 2
    return CGRect(
      x: (72 - width) / 2,
      y: (94 - height) / 2 - ring,
      width: width,
      height: height + ring * 2
    )
  }

  private func topAlignedPill(height: CGFloat) -> CGRect {
    let width = 44 + ring * 2
    return CGRect(x: (80 - width) / 2, y: -ring, width: width, height: height + ring * 2)
  }

  @Test
  func `rests the painted pill on the safe area, not its layout box`() {
    let drawn = centredPill(height: 44)
    let ranges = FABPlacement.ranges(bounds: bounds, safeArea: notch, drawnFrame: drawn, inset: inset)

    #expect(ranges.y.lowerBound + drawn.minY == 59)
    #expect(ranges.y.upperBound + drawn.maxY == 818)
    #expect(ranges.x.lowerBound + drawn.minX == 10)
    #expect(ranges.x.upperBound + drawn.maxX == 383)
  }

  @Test
  func `keeps the top clear while the label is still showing`() {
    let drawn = centredPill(height: 72)
    let ranges = FABPlacement.ranges(bounds: bounds, safeArea: notch, drawnFrame: drawn, inset: inset)

    #expect(ranges.y.lowerBound + drawn.minY == 59)
    #expect(ranges.y.upperBound + drawn.maxY == 818)
  }

  @Test
  func `reserves room for a pill that hangs below the gear`() {
    let drawn = topAlignedPill(height: 75)
    let ranges = FABPlacement.ranges(bounds: bounds, safeArea: notch, drawnFrame: drawn, inset: inset)

    #expect(ranges.y.upperBound + drawn.maxY == 818)
  }

  @Test
  func `falls back to the inset when an edge has no safe area`() {
    let drawn = topAlignedPill(height: 75)
    let ranges = FABPlacement.ranges(bounds: bounds, safeArea: flat, drawnFrame: drawn, inset: inset)

    #expect(ranges.y.lowerBound + drawn.minY == 10)
    #expect(ranges.y.upperBound + drawn.maxY == 842)
  }

  @Test
  func `clears a side bar that is wider than the inset`() {
    let sideBar = FABInsets(top: 0, leading: 0, bottom: 0, trailing: 59)
    let drawn = centredPill(height: 44)
    let ranges = FABPlacement.ranges(
      bounds: CGSize(width: 500, height: 500),
      safeArea: sideBar,
      drawnFrame: drawn,
      inset: inset
    )

    #expect(ranges.x.upperBound + drawn.maxX == 441)
    #expect(ranges.x.lowerBound + drawn.minX == 10)
  }
}
