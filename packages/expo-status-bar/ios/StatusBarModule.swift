// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import UIKit

public final class StatusBarModule: Module {
  private var stopObservingVerticalBarEdgeChanges: (() -> Void)?

  public func definition() -> ModuleDefinition {
    Name("ExpoStatusBar")

    Events("onVerticalBarEdgeChange")

    Function("getVerticalBarEdge") { () -> String? in
      var edge: String?
      EXUtilities.performSynchronously {
        edge = verticalBarEdge(of: SceneGeometry.keyWindow()?.traitCollection)
      }
      return edge
    }

    OnStartObserving("onVerticalBarEdgeChange") {
      DispatchQueue.main.async {
        self.observeVerticalBarEdge()
      }
    }

    OnStopObserving("onVerticalBarEdgeChange") {
      DispatchQueue.main.async {
        self.stopObservingVerticalBarEdge()
      }
    }
  }

  @MainActor
  private func observeVerticalBarEdge() {
    #if canImport(UIKit, _version: 9127.0.85)
    guard #available(iOS 27.1, tvOS 27.1, *), stopObservingVerticalBarEdgeChanges == nil,
      let window = SceneGeometry.keyWindow()
    else {
      return
    }
    let registration = window.registerForTraitChanges(
      UITraitCollection.systemTraitsAffectingVerticalBarEdge
    ) { [weak self] (window: UIWindow, previousTraits: UITraitCollection) in
      let edge = verticalBarEdge(of: window.traitCollection)
      if edge != verticalBarEdge(of: previousTraits) {
        self?.sendEvent("onVerticalBarEdgeChange", ["edge": edge])
      }
    }
    stopObservingVerticalBarEdgeChanges = { [weak window] in
      window?.unregisterForTraitChanges(registration)
    }
    #endif
  }

  @MainActor
  private func stopObservingVerticalBarEdge() {
    stopObservingVerticalBarEdgeChanges?()
    stopObservingVerticalBarEdgeChanges = nil
  }
}

private func verticalBarEdge(of traits: UITraitCollection?) -> String? {
  #if canImport(UIKit, _version: 9127.0.85)
  if #available(iOS 27.1, tvOS 27.1, *), let traits {
    switch traits.verticalBarEdge {
    case .leading:
      return "leading"
    case .trailing:
      return "trailing"
    default:
      return nil
    }
  }
  #endif
  return nil
}
