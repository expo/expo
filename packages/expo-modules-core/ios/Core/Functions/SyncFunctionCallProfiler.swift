// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/**
 Identifies a synchronous native call for profiling purposes: the module (or `Module.Class`)
 that owns it, the name JavaScript uses, and whether it is a plain function or a property accessor.
 */
public struct SyncCallIdentity: Sendable, Equatable {
  public enum Kind: String, Sendable {
    case function
    case propertyGetter = "property_getter"
    case propertySetter = "property_setter"
  }

  public let ownerName: String
  public let name: String
  public let kind: Kind

  public init(ownerName: String, name: String, kind: Kind) {
    self.ownerName = ownerName
    self.name = name
    self.kind = kind
  }

  /// `Owner.name`, e.g. `MidiModule.getOutputs`.
  public var qualifiedName: String {
    return ownerName.isEmpty ? name : "\(ownerName).\(name)"
  }
}

/**
 A synchronous native call, made from a JavaScript runtime's thread, that took longer than
 the threshold passed to `SyncFunctionCallProfiler.setObserver`.
 */
public struct SlowSyncCall: Sendable, Equatable {
  public let identity: SyncCallIdentity
  /// Seconds on the `mach_absolute_time` clock (the same clock as `CACurrentMediaTime()`),
  /// so observers can relate the call to their own launch markers.
  public let startedAt: TimeInterval
  /// Wall-clock seconds the call blocked its runtime thread, including argument conversion.
  public let duration: TimeInterval
  /// `true` when the runtime thread was the main thread (e.g. the UI worklet runtime).
  public let onMainThread: Bool
}

/**
 Times every synchronous `Function` and `Property` accessor call that reaches native code and
 reports the ones above a threshold to a single process-wide observer.

 A synchronous function blocks the JavaScript thread for as long as its body runs, and a body that
 waits on another thread, an XPC service or disk I/O turns straight into dropped frames or a late
 first render — invisible to main-thread watchdogs and to MetricKit. Performance tooling such as
 `expo-app-metrics` registers an observer here to surface those calls by name.

 When no observer is set the per-call cost is one lock-free load; with an observer it is two
 `mach_absolute_time` reads per call. The observer runs on the calling runtime thread and must be
 cheap and `Sendable`: hand the record off to your own queue instead of doing work inline.
 */
public enum SyncFunctionCallProfiler {
  public typealias Observer = @Sendable (SlowSyncCall) -> Void

  internal struct Configuration: Sendable {
    let threshold: TimeInterval
    let observer: Observer
  }

  private static let configuration = Mutex<Configuration?>(nil)

  /**
   Installs the observer that receives calls slower than `threshold` seconds. Replaces any previous observer.
   */
  public static func setObserver(threshold: TimeInterval, _ observer: @escaping Observer) {
    configuration.withLock { $0 = Configuration(threshold: threshold, observer: observer) }
  }

  /**
   Removes the observer. Calls are no longer timed.
   */
  public static func removeObserver() {
    configuration.withLock { $0 = nil }
  }

  /**
   A started measurement. Pass it to `finish(_:_:)` when the call returns (or throws).
   `nil` when no observer is installed, which makes a call cost a single lock-protected load.
   */
  internal struct Measurement {
    fileprivate let configuration: Configuration
    fileprivate let start: UInt64
  }

  @inline(__always)
  internal static func begin() -> Measurement? {
    guard let configuration = configuration.withLock({ $0 }) else {
      return nil
    }
    return Measurement(configuration: configuration, start: DispatchTime.now().uptimeNanoseconds)
  }

  /**
   Ends a measurement and reports it to the observer when it exceeded the threshold.
   */
  internal static func finish(_ measurement: Measurement?, _ identity: SyncCallIdentity?) {
    guard let measurement else {
      return
    }
    let end = DispatchTime.now().uptimeNanoseconds
    let duration = TimeInterval(end &- measurement.start) / 1_000_000_000
    if duration < measurement.configuration.threshold {
      return
    }
    measurement.configuration.observer(
      SlowSyncCall(
        identity: identity ?? SyncCallIdentity(ownerName: "", name: "", kind: .function),
        startedAt: TimeInterval(measurement.start) / 1_000_000_000,
        duration: duration,
        onMainThread: Thread.isMainThread
      )
    )
  }
}
