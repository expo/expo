// Copyright 2026-present 650 Industries. All rights reserved.

#if os(iOS) || os(tvOS)

import UIKit

/**
 Geometry lookups that start from the view asking the question, because iOS 27 makes iPhone apps
 freely resizable. Neither `UIScreen.main` nor the first key window in any connected scene describes
 the space a given view has, since either can belong to a differently sized scene.
 */
public enum SceneGeometry {
  public static func windowScene(for view: UIView? = nil) -> UIWindowScene? {
    if let scene = view?.window?.windowScene {
      return scene
    }
    return foregroundScene() ?? windowScenes().first
  }

  /// Deliberately strict, for callers deciding whether to attach a window to a scene at all.
  public static func foregroundActiveScene() -> UIWindowScene? {
    return windowScenes().first { $0.activationState == .foregroundActive }
  }

  /// Nil when no scene is on screen, so callers don't present UI into a background scene.
  public static func foregroundScene() -> UIWindowScene? {
    let scenes = windowScenes()
    return scenes.first { $0.activationState == .foregroundActive }
      ?? scenes.first { $0.activationState == .foregroundInactive }
  }

  private static func windowScenes() -> [UIWindowScene] {
    return UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
  }

  public static func keyWindow(for view: UIView? = nil) -> UIWindow? {
    guard let scene = windowScene(for: view) else {
      return nil
    }
    return scene.windows.first { $0.isKeyWindow } ?? scene.windows.first
  }

  public static func bounds(for view: UIView? = nil) -> CGRect {
    return (view?.window ?? keyWindow(for: view))?.bounds ?? .zero
  }

  public static func safeAreaSize(for view: UIView? = nil) -> CGSize {
    guard let window = view?.window ?? keyWindow(for: view) else {
      return .zero
    }
    let safeArea = window.safeAreaLayoutGuide.layoutFrame.size
    if safeArea.width > 0 && safeArea.height > 0 {
      return safeArea
    }
    return window.bounds.size
  }

  /// Never cache the result. Scale can differ per scene.
  public static func displayScale(for view: UIView? = nil) -> CGFloat {
    return resolveDisplayScale(candidates: [
      view?.traitCollection.displayScale,
      windowScene(for: view)?.traitCollection.displayScale,
      UITraitCollection.current.displayScale
    ])
  }

  /// Returns the first positive candidate. `UITraitCollection` reports an unspecified scale as 0.
  internal static func resolveDisplayScale(candidates: [CGFloat?]) -> CGFloat {
    for case let candidate? in candidates where candidate > 0 {
      return candidate
    }
    return 1
  }
}

#if os(iOS)
public extension SceneGeometry {
  /// Reads `effectiveGeometry` because `UIWindowScene.interfaceOrientation` is deprecated as of iOS 26.
  static func interfaceOrientation(for view: UIView? = nil) -> UIInterfaceOrientation {
    return windowScene(for: view)?.effectiveGeometry.interfaceOrientation ?? .unknown
  }
}
#endif

#endif
