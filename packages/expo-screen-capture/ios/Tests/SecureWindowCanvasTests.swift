// Copyright 2026-present 650 Industries. All rights reserved.

import Testing
import UIKit

@testable import ExpoScreenCapture

@Suite("SecureWindowCanvas", .serialized)
@MainActor
struct SecureWindowCanvasTests {
  /// Simulates an on-screen window: on device the window layer lives inside a host layer.
  private func makeAttachedWindow() -> (window: UIWindow, parent: CALayer) {
    let window = UIWindow(frame: UIScreen.main.bounds)
    let parent = CALayer()
    parent.addSublayer(window.layer)
    return (window, parent)
  }

  /// UIKit attaches a new window's layer to a host layer even off screen, so detach it
  /// to simulate a window whose layer host is not set up yet.
  private func makeDetachedWindow() -> UIWindow {
    let window = UIWindow(frame: .zero)
    window.layer.removeFromSuperlayer()
    return window
  }

  @Test
  func `init fails when the window layer has no superlayer`() {
    let window = makeDetachedWindow()

    #expect(SecureWindowCanvas(protecting: window) == nil)
  }

  @Test
  func `failed init leaves the window untouched`() {
    let window = makeDetachedWindow()

    _ = SecureWindowCanvas(protecting: window)

    #expect(window.layer.superlayer == nil)
  }

  @Test
  func `init re-parents the window layer into a secure canvas under the original parent`() throws {
    let (window, parent) = makeAttachedWindow()

    let canvas = try #require(SecureWindowCanvas(protecting: window))

    #expect(canvas.window === window)
    #expect(window.layer.superlayer !== parent)

    var ancestor = window.layer.superlayer
    var reachedOriginalParent = false
    while let layer = ancestor {
      if layer === parent {
        reachedOriginalParent = true
        break
      }
      ancestor = layer.superlayer
    }
    #expect(reachedOriginalParent)
  }

  @Test
  func `restore returns the window layer to its original parent and removes the canvas`() throws {
    let (window, parent) = makeAttachedWindow()
    let canvas = try #require(SecureWindowCanvas(protecting: window))

    canvas.restore()

    #expect(window.layer.superlayer === parent)
    #expect(parent.sublayers?.count == 1)
  }

  @Test
  func `restore removes the secure canvas when the window is gone`() throws {
    let parent = CALayer()
    var window: UIWindow? = UIWindow(frame: UIScreen.main.bounds)
    parent.addSublayer(window!.layer)
    let canvas = try #require(SecureWindowCanvas(protecting: window!))

    window = nil
    #expect(canvas.window == nil)

    canvas.restore()

    #expect(parent.sublayers?.isEmpty != false)
  }

  @Test
  func `a window can be protected again after restore`() throws {
    let (window, parent) = makeAttachedWindow()
    let first = try #require(SecureWindowCanvas(protecting: window))
    first.restore()

    let second = try #require(SecureWindowCanvas(protecting: window))

    #expect(second.window === window)
    second.restore()
    #expect(window.layer.superlayer === parent)
  }
}
