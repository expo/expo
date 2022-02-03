// Copyright 2021-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class KeepAwakeModule: Module {
  private var activeTags = Set<String>()

  public func definition() -> ModuleDefinition {
    name("ExpoKeepAwake")

    function("activate", activate)
    function("deactivate", deactivate)
    function("isActivated", isActivated)

    onAppEntersForeground {
      if !self.activeTags.isEmpty {
        setActivated(true)
      }
    }
    onAppEntersBackground {
      if !self.activeTags.isEmpty {
        setActivated(false)
      }
    }
  }

  private func activate(tag: String) -> Bool {
    if activeTags.isEmpty {
      setActivated(true)
    }
    activeTags.insert(tag)
    return true
  }

  private func deactivate(tag: String) -> Bool {
    activeTags.remove(tag)
    if activeTags.isEmpty {
      setActivated(false)
    }
    return true
  }
}

private func isActivated() -> Bool {
  return DispatchQueue.main.sync {
    return UIApplication.shared.isIdleTimerDisabled
  }
}

private func setActivated(_ activated: Bool) {
  DispatchQueue.main.async {
    UIApplication.shared.isIdleTimerDisabled = activated
  }
}
