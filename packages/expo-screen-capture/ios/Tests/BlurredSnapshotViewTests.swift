// Copyright 2026-present 650 Industries. All rights reserved.

import Testing
import UIKit

@testable import ExpoScreenCapture

@Suite("BlurredSnapshotView", .serialized)
@MainActor
struct BlurredSnapshotViewTests {
  private func makeView(size: CGSize = CGSize(width: 200, height: 400)) -> UIView {
    let view = UIView(frame: CGRect(origin: .zero, size: size))
    view.backgroundColor = .red
    return view
  }

  @Test
  func `init fails when the view has no size`() {
    let view = makeView(size: .zero)

    #expect(BlurredSnapshotView(snapshotOf: view, intensity: 0.5) == nil)
  }

  @Test
  func `init covers the bounds of the snapshotted view`() throws {
    let view = makeView()

    let snapshotView = try #require(BlurredSnapshotView(snapshotOf: view, intensity: 0.5))

    #expect(snapshotView.frame == view.bounds)
    #expect(snapshotView.subviews.contains { $0 is UIImageView })
  }

  @Test
  func `tint scales with the intensity`() throws {
    let view = makeView()

    let none = try #require(BlurredSnapshotView(snapshotOf: view, intensity: 0))
    let half = try #require(BlurredSnapshotView(snapshotOf: view, intensity: 0.5))
    let full = try #require(BlurredSnapshotView(snapshotOf: view, intensity: 1))

    #expect(none.tintAlpha == 0)
    #expect(half.tintAlpha > none.tintAlpha)
    #expect(full.tintAlpha > half.tintAlpha)
  }

  @Test
  func `intensity is clamped between 0 and 1`() throws {
    let view = makeView()

    let below = try #require(BlurredSnapshotView(snapshotOf: view, intensity: -1))
    let above = try #require(BlurredSnapshotView(snapshotOf: view, intensity: 2))
    let full = try #require(BlurredSnapshotView(snapshotOf: view, intensity: 1))

    #expect(below.tintAlpha == 0)
    #expect(above.tintAlpha == full.tintAlpha)
  }
}
