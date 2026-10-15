import CoreGraphics
import SwiftUI
import Testing

@testable import ExpoMaps

// A tap that lands on a marker or an annotation belongs to that feature, and `onMapClick` documents
// that it is not invoked in that case. Markers and annotations are drawn at a fixed size in screen
// space, so recognizing such a tap means matching it against where the feature is rendered rather
// than against the coordinate the tap converts to.
@Suite("Feature hit testing")
struct FeatureHitTestingTests {
  @Test
  func `a balloon hangs above the coordinate at its tip`() {
    let rect = markerHitRect(at: CGPoint(x: 100, y: 200))

    #expect(rect.maxY == 200)
    #expect(rect.midX == 100)
    #expect(rect.minY < 200)
  }

  @Test
  func `a tap on the balloon body is on the marker`() {
    let rect = markerHitRect(at: CGPoint(x: 100, y: 200))

    #expect(rect.contains(CGPoint(x: 100, y: 190)))
  }

  @Test
  func `a tap below the balloon tip is not on the marker`() {
    let rect = markerHitRect(at: CGPoint(x: 100, y: 200))

    #expect(rect.contains(CGPoint(x: 100, y: 210)) == false)
  }

  @Test
  func `a tap beside the balloon is not on the marker`() {
    let rect = markerHitRect(at: CGPoint(x: 100, y: 200))

    #expect(rect.contains(CGPoint(x: 400, y: 190)) == false)
  }

  @Test
  func `an annotation is centred on its coordinate`() {
    let rect = annotationHitRect(at: CGPoint(x: 100, y: 200))

    #expect(rect.midX == 100)
    #expect(rect.midY == 200)
  }

  @Test
  func `a tap just above an annotation coordinate is on the annotation`() {
    let rect = annotationHitRect(at: CGPoint(x: 100, y: 200))

    // A balloon-shaped hit rect would miss this point, an annotation's centred one does not.
    #expect(rect.contains(CGPoint(x: 100, y: 210)))
  }

  @Test
  func `an anchored annotation's hit rect follows where it is drawn`() {
    // An annotation anchored at the bottom of its content is drawn entirely above the coordinate,
    // the way a teardrop pin points at the place it marks.
    let rect = annotationHitRect(at: CGPoint(x: 100, y: 200), anchor: .bottom)

    #expect(rect.maxY == 200)
    #expect(rect.midX == 100)
  }

  @Test
  func `a tap on an anchored annotation is on the annotation`() {
    let rect = annotationHitRect(at: CGPoint(x: 100, y: 200), anchor: .bottom)

    #expect(rect.contains(CGPoint(x: 100, y: 190)))
  }

  @Test
  func `a tap below an anchored annotation is not on the annotation`() {
    // Where a centred rect would still reach, an anchored one has already ended.
    let rect = annotationHitRect(at: CGPoint(x: 100, y: 200), anchor: .bottom)

    #expect(rect.contains(CGPoint(x: 100, y: 210)) == false)
  }

  @Test
  func `anchor places the coordinate within the rect`() {
    let size = CGSize(width: 10, height: 20)
    let origin = CGPoint(x: 0, y: 0)

    #expect(featureHitRect(at: origin, size: size, anchor: .top).minY == 0)
    #expect(featureHitRect(at: origin, size: size, anchor: .center).midY == 0)
    #expect(featureHitRect(at: origin, size: size, anchor: .bottom).maxY == 0)
    #expect(featureHitRect(at: origin, size: size, anchor: .leading).minX == 0)
    #expect(featureHitRect(at: origin, size: size, anchor: .trailing).maxX == 0)
  }
}
