// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation

/// The runtime that the props decoders of v2 views use on each thread for props that come as `folly::dynamic`,
/// without a runtime: from Reanimated, React Native's animations, and every update of a view after
/// `setNativeProps`. A value converted from `folly::dynamic` doesn't depend on the runtime that converted it, so
/// any runtime that is safe to use on the thread works: the React Native runtime on its JavaScript thread, and the
/// worklets UI runtime on the main thread. Without `installOnUIRuntime`, the UI runtime has no `global.expo`, so
/// props of `Record` and `Either` types don't decode in it.
internal enum ViewPropsRuntimes {
  /// Makes `runtime` the runtime of the current thread, in place of the one registered before. The thread keeps
  /// its handle, so a runtime that goes away isn't used. It keeps a runtime that other threads use too.
  static func registerForCurrentThread(_ runtime: JavaScriptRuntime) {
    let entry = Unmanaged.passRetained(Entry(runtime: runtime)).toOpaque()
    if let oldEntry = pthread_getspecific(entryKey) {
      Unmanaged<Entry>.fromOpaque(oldEntry).release()
    }
    pthread_setspecific(entryKey, entry)
  }

  /// Adds an app context whose main runtime can find the worklets UI runtime for the main thread.
  static func addAppContext(_ appContext: AppContext) {
    appContexts.withLock { appContexts in
      appContexts.removeAll { $0.appContext == nil }
      appContexts.append(WeakAppContext(appContext: appContext))
    }
  }

  /// Runs `body` with a pointer to the `jsi::Runtime` of the runtime of the current thread, holding its lock if it
  /// has one, and returns `true`. Returns `false` without running `body` when the thread has no live runtime. On
  /// the main thread, it then starts a lookup of the worklets UI runtime.
  static func withRuntimeForCurrentThread(_ body: (UnsafeRawPointer) -> Void) -> Bool {
    guard let entryPointer = pthread_getspecific(entryKey) else {
      findRuntimeIfMainThread()
      return false
    }
    let entry = Unmanaged<Entry>.fromOpaque(entryPointer).takeUnretainedValue()
    guard let runtime = entry.handle.runtime else {
      findRuntimeIfMainThread()
      return false
    }
    guard let locking = entry.locking else {
      runtime.withUnsafePointee { body(UnsafeRawPointer($0)) }
      return true
    }
    if locking.withLock({ runtime.withUnsafePointee { body(UnsafeRawPointer($0)) } }) {
      return true
    }
    findRuntimeIfMainThread()
    return false
  }

  /// Whether the decoders should report the props that they skip on the current thread. The main thread doesn't
  /// report them while it waits for the newest lookup of the worklets UI runtime, which usually finds it.
  static func shouldReportSkippedProps() -> Bool {
    guard pthread_main_np() != 0 else {
      return true
    }
    return MainActor.assumeIsolated {
      pendingLookups == 0
    }
  }

  // MARK: - Lookup of the worklets UI runtime

  /// The time between two lookups, in nanoseconds. Each miss on the main thread can start a lookup, for example on
  /// each frame of an animation, so they're limited. A later lookup finds the UI runtime when `react-native-worklets`
  /// loads after the first one, or after a reload.
  private static let lookupInterval: UInt64 = 1_000_000_000

  @MainActor
  private static var lastLookupStart: UInt64?

  /// The number of the newest lookup, so that an older lookup that finishes later doesn't count.
  @MainActor
  private static var lookupNumber = 0

  /// The app contexts that the newest lookup still waits for. A main runtime that is torn down drops its lookup, which
  /// then waits until the next lookup starts.
  @MainActor
  private static var pendingLookups = 0

  private static func findRuntimeIfMainThread() {
    guard pthread_main_np() != 0 else {
      return
    }
    MainActor.assumeIsolated {
      let now = DispatchTime.now().uptimeNanoseconds
      if let lastLookupStart, now - lastLookupStart < lookupInterval {
        return
      }
      lastLookupStart = now
      lookupNumber += 1

      let number = lookupNumber
      let appContexts = appContexts.withLock { $0.compactMap(\.appContext) }
      pendingLookups = appContexts.count
      for appContext in appContexts {
        appContext.findWorkletsUIRuntime {
          if number == lookupNumber {
            pendingLookups -= 1
          }
        }
      }
    }
  }

  /// The app contexts whose main runtime can find the worklets UI runtime. Usually one, more with several React
  /// Native hosts.
  private static let appContexts = Mutex<[WeakAppContext]>([])

  private struct WeakAppContext {
    weak var appContext: AppContext?
  }

  // MARK: - Entries

  private final class Entry {
    // Not a `weak` reference to the runtime, which would make each retain and release of the runtime slower.
    let handle: JavaScriptRuntimeHandle
    // Kept strongly, because only the thread that releases a runtime can read its handle safely, and other threads
    // use this runtime too. `withLock` returns `false` when the engine runtime is gone.
    let locking: (any JavaScriptRuntimeLocking)?

    init(runtime: JavaScriptRuntime) {
      self.handle = runtime.handle
      self.locking = runtime as? any JavaScriptRuntimeLocking
    }
  }

  /// The key of the current thread's entry. Its destructor releases the entry when the thread exits.
  private static let entryKey: pthread_key_t = {
    var key = pthread_key_t()
    pthread_key_create(&key) { entry in
      Unmanaged<Entry>.fromOpaque(entry).release()
    }
    return key
  }()
}

extension AppContext {
  /// Finds the worklets UI runtime through the main runtime and registers it for the main thread, without
  /// installing Expo on it. `completion` runs on the main thread after the lookup. It doesn't run when the main runtime
  /// is torn down before the lookup runs on the JavaScript thread.
  @MainActor
  fileprivate func findWorkletsUIRuntime(completion: @escaping @MainActor @Sendable () -> Void) {
    guard let mainRuntime = try? runtime else {
      completion()
      return
    }
    if let uiRuntime = workletsUIRuntime.withLock({ $0 }) {
      ViewPropsRuntimes.registerForCurrentThread(uiRuntime)
      completion()
      return
    }
    mainRuntime.schedule { [weak self] in
      let makeUIRuntime = self?.locateWorkletsUIRuntime(in: mainRuntime)
      DispatchQueue.main.async { [weak self] in
        if let makeUIRuntime, let uiRuntime = self?.storedOrNewWorkletsUIRuntime(makeUIRuntime) {
          ViewPropsRuntimes.registerForCurrentThread(uiRuntime)
        }
        completion()
      }
    }
  }

  /// Finds the worklets UI runtime through the main runtime, and returns a function that makes its wrapper. Returns
  /// `nil` when `react-native-worklets` didn't load. It makes no JSI calls on the UI runtime: a UI worklet can hold the
  /// lock of the UI runtime on the main thread while it waits for the JavaScript thread, for example in `runOnRNSync`.
  @JavaScriptActor
  private func locateWorkletsUIRuntime(in runtime: JavaScriptRuntime) -> (@Sendable () -> JavaScriptRuntime?)? {
    guard let locator = AppContext.uiRuntimeLocator else {
      return nil
    }
    // `react-native-worklets` installs this object in the main runtime when its JavaScript loads. Its
    // `getUIRuntimeHolder()` gives the holder that `installOnUIRuntime` takes too.
    let proxy = runtime.global().getProperty("__workletsModuleProxy")
    guard proxy.isObject() else {
      return nil
    }
    do {
      let proxyObject = proxy.getObject()
      let holder = try proxyObject.getPropertyAsFunction("getUIRuntimeHolder").call(this: proxyObject)
      return locator(holder, runtime)
    } catch {
      let isFirstReport = Self.reportedUIRuntimeLookupFailure.withLock { reported in
        defer { reported = true }
        return !reported
      }
      if isFirstReport {
        log.warn(
          "Can't find the worklets UI runtime: \(error). Until Expo finds it, the props of v2 views that Reanimated animates on the main thread change only at React commits. Expo tries again each second while it gets such props, and doesn't log this again. If these animations stay choppy, report it to Expo with this message"
        )
      }
      return nil
    }
  }

  /// Whether a lookup logged that it can't find the worklets UI runtime. Lookups repeat each second during an
  /// animation, so only the first failure logs.
  private static let reportedUIRuntimeLookupFailure = Mutex(false)

  /// Returns the wrapper of the worklets UI runtime, and makes it with `makeUIRuntime` when there's none yet.
  @MainActor
  private func storedOrNewWorkletsUIRuntime(_ makeUIRuntime: () -> JavaScriptRuntime?) -> JavaScriptRuntime? {
    if let uiRuntime = workletsUIRuntime.withLock({ $0 }) {
      return uiRuntime
    }
    // A decode on the main thread must hold the lock of the UI runtime, which the JavaScript thread uses too.
    guard let uiRuntime = makeUIRuntime(), uiRuntime is any JavaScriptRuntimeLocking else {
      return nil
    }
    workletsUIRuntime.withLock { $0 = uiRuntime }
    return uiRuntime
  }
}
