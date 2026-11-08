// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesCore

@ExpoModule("ExpoKeepAwake")
public final class KeepAwakeModule: Module {
  // Read and changed on the main thread only.
  private var activeTags = Set<String>()

  @JS
  @MainActor
  func activate(tag: String) async -> Bool {
    if activeTags.isEmpty {
      setActivated(true)
    }
    activeTags.insert(tag)
    return true
  }

  @JS
  @MainActor
  func deactivate(tag: String) async -> Bool {
    activeTags.remove(tag)
    if activeTags.isEmpty {
      setActivated(false)
    }
    return true
  }

  @JS
  @MainActor
  func isActivated() async -> Bool {
    #if os(iOS) || os(tvOS)
    return UIApplication.shared.isIdleTimerDisabled
    #elseif os(macOS)
    return false
    #endif
  }

  public override func appWillEnterForeground() {
    if !activeTags.isEmpty {
      setActivated(true)
    }
  }

  public override func appDidEnterBackground() {
    if !activeTags.isEmpty {
      setActivated(false)
    }
  }
}

@MainActor
private func setActivated(_ activated: Bool) {
  #if os(iOS) || os(tvOS)
  UIApplication.shared.isIdleTimerDisabled = activated
  #endif
}
