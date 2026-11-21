// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

/**
 * The playback state that JS wants. Any thread can change it.
 * A pass on the main thread copies the changed values and writes them to the `AVPlayer`,
 * so many writes between two passes become one write for each value.
 */
internal final class PlaybackState {
  enum Action: Equatable {
    case play(onlyIfPaused: Bool), pause
  }

  struct Setting<Value: Equatable> {
    fileprivate(set) var value: Value
    // True from a JS write until a pass takes the value. The player's reports are ignored meanwhile.
    fileprivate var isChanged = false
  }

  struct Snapshot {
    var volume = Setting(value: Float(1))
    var muted = Setting(value: false)
    var rate = Setting(value: Float(1))
    fileprivate var observedPlaying = Setting(value: false)
    fileprivate var action: Action?
    // True from a `pause` request until the player is paused, so `playing` reads false at once.
    fileprivate var isPausing = false

    var playing: Bool {
      return !isPausing && observedPlaying.value
    }

    fileprivate mutating func request(_ newAction: Action) {
      if action == .play(onlyIfPaused: false), newAction == .play(onlyIfPaused: true) {
        return
      }
      action = newAction
      isPausing = newAction == .pause
    }
  }

  /// The values that one pass writes to the player. A nil value did not change.
  struct Changes {
    var volume: Float?
    var muted: Bool?
    var rate: Float?
    var action: Action?
  }

  private struct State {
    var snapshot = Snapshot()
    var isPassScheduled = false
    var isApplying = false
    var closed = false
  }

  private let state = Mutex(State())
  private let events = DispatchQueue(label: "expo.video.playbackEvents")

  func read<Value>(_ key: KeyPath<Snapshot, Value>) -> Value {
    return state.withLock { $0.snapshot[keyPath: key] }
  }

  func setVolume(
    _ volume: Float,
    notify: @escaping (Float, Float) -> Void,
    apply: @escaping @MainActor (Changes) -> Void
  ) {
    change(apply: apply) { snapshot in
      set(&snapshot.volume, to: volume, notify: notify)
    }
  }

  func setMuted(
    _ muted: Bool,
    notify: @escaping (Bool, Bool) -> Void,
    apply: @escaping @MainActor (Changes) -> Void
  ) {
    change(apply: apply) { snapshot in
      set(&snapshot.muted, to: muted, notify: notify)
    }
  }

  func setRate(
    _ rate: Float,
    notify: @escaping (Float, Float) -> Void,
    apply: @escaping @MainActor (Changes) -> Void
  ) {
    change(apply: apply) { snapshot in
      set(&snapshot.rate, to: rate, notify: notify)
      if rate == 0 {
        snapshot.request(.pause)
      }
    }
  }

  func request(_ action: Action, apply: @escaping @MainActor (Changes) -> Void) {
    change(apply: apply) { snapshot in
      snapshot.request(action)
    }
  }

  @MainActor
  func observed<Value>(
    _ key: WritableKeyPath<Snapshot, Setting<Value>>,
    value: Value,
    notify: @escaping (Value, Value) -> Void
  ) {
    state.withLock { state in
      guard !state.closed, !state.snapshot[keyPath: key].isChanged else {
        return
      }
      update(&state.snapshot[keyPath: key], to: value, notify: notify)
    }
  }

  @MainActor
  func observedPlaying(_ playing: Bool, notify: @escaping (Bool, Bool) -> Void) {
    state.withLock { state in
      guard !state.closed, !playing || !state.snapshot.isPausing else {
        return
      }
      update(&state.snapshot.observedPlaying, to: playing, notify: notify)
    }
  }

  func close() {
    state.withLock { $0.closed = true }
  }

  private func change(apply: @escaping @MainActor (Changes) -> Void, _ body: (inout Snapshot) -> Void) {
    let runsNow = state.withLock { state -> Bool in
      guard !state.closed else {
        return false
      }
      body(&state.snapshot)
      if Thread.isMainThread {
        // A pass that is in progress takes this change in its next round.
        return !state.isApplying
      }
      if !state.isPassScheduled {
        state.isPassScheduled = true
        DispatchQueue.main.async { self.runPass(apply: apply) }
      }
      return false
    }
    if runsNow {
      MainActor.assumeIsolated { runPass(apply: apply) }
    }
  }

  private func set<Value>(
    _ setting: inout Setting<Value>,
    to value: Value,
    notify: @escaping (Value, Value) -> Void
  ) {
    update(&setting, to: value, notify: notify)
    setting.isChanged = true
  }

  private func update<Value>(
    _ setting: inout Setting<Value>,
    to value: Value,
    notify: @escaping (Value, Value) -> Void
  ) {
    let previous = setting.value
    guard previous != value else {
      return
    }
    setting.value = value
    // Preserve the order of JS and native transitions without calling listeners under the lock.
    events.async {
      if !self.state.withLock({ $0.closed }) {
        notify(previous, value)
      }
    }
  }

  @MainActor
  private func runPass(apply: (Changes) -> Void) {
    var applied: Changes?
    while let changes = takeChanges(after: applied) {
      // The lock is not held here. The player sends KVO notifications in this call stack,
      // and their handlers take the lock.
      apply(changes)
      applied = changes
    }
  }

  /// Returns the values that changed since the last pass and marks them as taken.
  /// Returns nil, and ends the pass, when nothing changed.
  private func takeChanges(after applied: Changes?) -> Changes? {
    return state.withLock { state -> Changes? in
      state.isPassScheduled = false
      if state.isApplying && applied == nil {
        // Another pass is in progress in this call stack. It takes the changes.
        return nil
      }
      if case .pause = applied?.action, state.snapshot.action == nil {
        state.snapshot.isPausing = false
      }
      var changes = Changes()
      var hasChanges = false
      if !state.closed {
        hasChanges = take(&state.snapshot.volume, into: &changes.volume)
        hasChanges = take(&state.snapshot.muted, into: &changes.muted) || hasChanges
        hasChanges = take(&state.snapshot.rate, into: &changes.rate) || hasChanges
        if let action = state.snapshot.action {
          changes.action = action
          state.snapshot.action = nil
          hasChanges = true
        }
      }
      state.isApplying = hasChanges
      return hasChanges ? changes : nil
    }
  }

  private func take<Value>(_ setting: inout Setting<Value>, into change: inout Value?) -> Bool {
    guard setting.isChanged else {
      return false
    }
    setting.isChanged = false
    change = setting.value
    return true
  }
}
