// Copyright 2026-present 650 Industries. All rights reserved.

/// Availability of Swift task executor preferences ([SE-0417](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0417-task-executor-preference.md)).
///
/// The runtime uses a task executor preference to bring asynchronous work back to the JavaScript
/// thread after a suspension point. The API is not back-deployed, so it is unavailable below iOS 18,
/// macOS 15, watchOS 11 and tvOS 18, and the runtime falls back to a compatibility path there.
///
/// Kept in one place because ``JavaScriptRuntimeExecutor/usesTaskExecutorPreference`` only defaults
/// to it: a test lowers that flag per runtime to cover the fallback on any operating system.
internal enum TaskExecutorPreference {
  @inline(__always)
  internal static var isAvailableOnThisOS: Bool {
    if #available(macOS 15.0, iOS 18.0, watchOS 11.0, tvOS 18.0, visionOS 2.0, *) {
      return true
    }
    return false
  }
}
