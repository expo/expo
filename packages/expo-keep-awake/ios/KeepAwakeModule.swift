// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesCore

@ExpoModule("ExpoKeepAwake")
public final class KeepAwakeModule: Module {
  // Read and changed on the main thread only.
  private var activeTags = Set<String>()

  public override func didCreate() {
    #if os(iOS) || os(tvOS)
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(appWillEnterForeground),
      name: UIApplication.willEnterForegroundNotification,
      object: nil
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(appDidEnterBackground),
      name: UIApplication.didEnterBackgroundNotification,
      object: nil
    )
    #endif
  }

  public override func willDestroy() {
    NotificationCenter.default.removeObserver(self)
  }

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

  // UIApplication posts the lifecycle notifications on the main thread.
  @objc
  @MainActor
  private func appWillEnterForeground() {
    if !activeTags.isEmpty {
      setActivated(true)
    }
  }

  @objc
  @MainActor
  private func appDidEnterBackground() {
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
