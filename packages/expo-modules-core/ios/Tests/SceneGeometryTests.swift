// Copyright 2026-present 650 Industries. All rights reserved.

#if os(iOS) || os(tvOS)

import Testing
import UIKit

@testable import ExpoModulesCore

@Suite("SceneGeometry")
@MainActor
struct SceneGeometryTests {
  @Test
  func `display scale prefers the first specified candidate`() {
    #expect(SceneGeometry.resolveDisplayScale(candidates: [3, 2]) == 3)
  }

  @Test
  func `display scale skips unspecified candidates`() {
    // UITraitCollection documents an unspecified displayScale as 0.0, so a zero
    // must not win over a real scale further down the chain.
    #expect(SceneGeometry.resolveDisplayScale(candidates: [nil, 0, 2]) == 2)
  }

  @Test
  func `display scale falls back to one when nothing is specified`() {
    #expect(SceneGeometry.resolveDisplayScale(candidates: [nil, 0]) == 1)
  }

  @Test
  func `bounds come from the view's own window when several exist`() {
    let other = UIWindow(frame: CGRect(x: 0, y: 0, width: 320, height: 480))
    let host = UIWindow(frame: CGRect(x: 0, y: 0, width: 744, height: 1133))
    let view = UIView()
    host.addSubview(view)

    #expect(SceneGeometry.bounds(for: view) == host.bounds)
    #expect(SceneGeometry.bounds(for: view) != other.bounds)
  }

  @Test
  func `bounds follow the view as it moves between windows`() {
    let first = UIWindow(frame: CGRect(x: 0, y: 0, width: 320, height: 480))
    let second = UIWindow(frame: CGRect(x: 0, y: 0, width: 744, height: 1133))
    let view = UIView()

    first.addSubview(view)
    #expect(SceneGeometry.bounds(for: view) == first.bounds)

    second.addSubview(view)
    #expect(SceneGeometry.bounds(for: view) == second.bounds)
  }

  @Test
  func `safe area size comes from the view's own window when several exist`() {
    let other = UIWindow(frame: CGRect(x: 0, y: 0, width: 320, height: 480))
    let host = UIWindow(frame: CGRect(x: 0, y: 0, width: 744, height: 1133))
    let view = UIView()
    host.addSubview(view)
    host.layoutIfNeeded()

    #expect(SceneGeometry.safeAreaSize(for: view) == host.safeAreaLayoutGuide.layoutFrame.size)
    #expect(SceneGeometry.safeAreaSize(for: view) != other.safeAreaLayoutGuide.layoutFrame.size)
  }

  @Test
  func `display scale is always positive`() {
    // Callers divide by this value, so it must never be zero regardless of how much of the
    // environment is available.
    #expect(SceneGeometry.displayScale(for: UIView()) > 0)
  }
}

#endif
