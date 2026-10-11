// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

final class AppStartupMonitoring: MetricReporter, @unchecked Sendable {
  enum StartupState {
    case launching, launched, interrupted
  }

  @AppMetricsActor
  internal let markers = AppStartupMarkers()

  @AppMetricsActor
  var startupState: StartupState = .launching {
    didSet {
      if startupState == .interrupted {
        frameMetricsRecorder.stop()
        stallMonitor.stop()
      }
    }
  }

  let frameMetricsRecorder = FrameMetricsRecorder()

  /// Watches the main thread over the TTI window and reports each stall with its backtrace.
  let stallMonitor = MainThreadStallMonitor()
  /// Read from the stall monitor's thread when a stall is detected, so it lives outside the actor.
  private let startupPhase = LockedValue("beforeFirstRender")

  /// Slow synchronous native calls seen before TTI; attached to the `timeToInteractive` metric.
  @AppMetricsActor
  private(set) var slowNativeCalls = SlowNativeCallSummary()

  lazy var appLaunchState = AppLaunchState()

  lazy var launchType: AppLaunchType = getAppLaunchType()

  nonisolated func markMain() {
    startObservingSlowNativeCalls()
    if launchType == .prewarmed {
      return
    }
    let currentTime = CACurrentMediaTime()

    AppMetricsActor.isolated { [self] in
      markers.main = currentTime
    }
  }

  nonisolated func markDidFinishLaunching() {
    // App has finished loading – save the current app launch state
    AppMetricsUserDefaults.lastAppLaunchState = appLaunchState

    if launchType == .prewarmed {
      return
    }
    let currentTime = CACurrentMediaTime()
    let currentDate = Date()

    AppMetricsActor.isolated { [self] in
      if startupState != .launching {
        return
      }
      markers.finishedLaunching = currentTime
      markers.finishedLaunchingDate = currentDate

      // Start tracking frame metrics from this point so the data
      // matches the TTI window (finishedLaunching → markInteractive).
      frameMetricsRecorder.start()
      stallMonitor.start(anchor: currentTime, phase: { [weak self] in self?.startupPhase.value ?? "unknown" }) {
        [weak self] stall, endedAt in
        AppMetricsActor.isolated {
          self?.reportStall(stall, endedAt: endedAt)
        }
      }

      if let launchTime = markers.getLaunchTime() {
        reportMetric(category: .appStartup, name: "\(launchType.rawValue)LaunchTime", value: launchTime)
      }
    }
  }

  nonisolated func markFirstRender() {
    if launchType == .prewarmed {
      return
    }
    let currentTime = CACurrentMediaTime()

    AppMetricsActor.isolated { [self] in
      if startupState != .launching {
        return
      }
      if markers.timeToFirstRender != nil {
        return
      }
      markers.timeToFirstRender = currentTime
      startupPhase.value = "beforeInteractive"

      // There is no event for when the bundle finished loading,
      // but we're sure it's already available once the first render occurs.
      if let bundleLoadTime = markers.getBundleLoadTime() {
        reportMetric(category: .appStartup, name: "bundleLoadTime", value: bundleLoadTime)
      }
      if let ttfr = markers.getTTFR() {
        reportMetric(category: .appStartup, name: "timeToFirstRender", value: ttfr)
      }
    }
  }

  nonisolated func markInteractive(routeName: String? = nil, params: [String: Any] = [:]) {
    if launchType == .prewarmed {
      return
    }
    let currentTime = CACurrentMediaTime()
    nonisolated(unsafe) let params = params

    AppMetricsActor.isolated { [self] in
      if startupState != .launching {
        return
      }
      if markers.timeToInteractive != nil {
        return
      }
      markers.timeToInteractive = currentTime
      startupPhase.value = "afterInteractive"

      if let tti = markers.getTTI() {
        let frameMetrics = frameMetricsRecorder.stop()
        let mainThreadStalls = stallMonitor.stop()
        let deviceState = await DeviceConditions.deviceState()
        let networkPath = await NetworkPathMonitor.shared.waitForFirstPath()
        let networkRequests: NetworkRequestSummary? = {
          guard let anchor = markers.finishedLaunchingDate else {
            return nil
          }
          return NetworkRequestMonitor.shared.summarize(start: anchor, end: Date())
        }()
        let mergedParams = MetricParamsBuilder.build(
          userParams: params,
          frameMetrics: frameMetrics,
          deviceState: deviceState,
          networkPath: networkPath,
          networkRequests: networkRequests,
          mainThreadStalls: mainThreadStalls,
          slowNativeCalls: slowNativeCalls
        )
        let metric = Metric(
          category: .appStartup,
          name: "timeToInteractive",
          value: tti,
          routeName: routeName,
          params: mergedParams.isEmpty ? nil : mergedParams
        )
        reportMetric(metric)
      }
      startupState = .launched
    }
  }

  @AppMetricsActor
  private func reportStall(_ stall: MainThreadStall, endedAt: Date) {
    reportLog(stall.toLogRecord(timestamp: endedAt))
  }

  /// Installs the process-wide `SyncFunctionCallProfiler` observer. Stays installed for the whole
  /// session: during startup every call over `SlowNativeCall.startupThreshold` is reported, afterwards
  /// only those over `steadyStateThreshold`. The observer runs on the calling runtime thread, so it
  /// only reads the phase and hops to the actor.
  nonisolated func startObservingSlowNativeCalls() {
    SyncFunctionCallProfiler.setObserver(threshold: SlowNativeCall.startupThreshold) { [weak self] call in
      guard let self else {
        return
      }
      let phase = self.startupPhase.value
      if phase == "afterInteractive" && call.duration < SlowNativeCall.steadyStateThreshold {
        return
      }
      let endedAt = Date()
      AppMetricsActor.isolated {
        self.recordSlowNativeCall(call, phase: phase, endedAt: endedAt)
      }
    }
  }

  @AppMetricsActor
  func recordSlowNativeCall(_ call: SlowSyncCall, phase: String, endedAt: Date) {
    let slowCall = SlowNativeCall(call: call, phase: phase, anchor: markers.finishedLaunching ?? markers.main)
    reportLog(slowCall.toLogRecord(timestamp: endedAt))
    if startupState == .launching {
      slowNativeCalls.add(slowCall)
    }
  }

  @AppMetricsActor
  var metrics: AppStartupTimes {
    return AppStartupTimes(
      loadTime: markers.getLoadTime(),
      launchTime: markers.getLaunchTime(),
      timeToFirstRender: markers.getTTFR(),
      timeToInteractive: markers.getTTI(),
      bundleLoadTime: markers.getBundleLoadTime()
    )
  }

  // MARK: - AppLaunchType

  internal enum AppLaunchType: String {
    /// The app is launched from scratch. The system must allocate memory, start a fresh runtime environment,
    /// load the app's code and resources from disk, and initialize its components before rendering the UI.
    /// This is the slowest type of launch and typically occurs after a fresh install, reboot,
    /// or when the OS has killed the app to reclaim memory
    case cold
    /// The app's main process is still running in memory, but the UI and navigation state have been torn down.
    /// The system does not need to restart the app process or reinitialize the runtime environment,
    /// but it must recreate the app's interface and restore any preserved state.
    /// This often happens when the app is in a background state and the system has cleared its UI to free up memory.
    case warm
    /// The system prewarmed the app, partially running its launch sequence in the background before the user opens it.
    /// In this case we can't reliably measure app startup times, so we do not collect these metrics.
    case prewarmed
  }

  /// Tries to guess what type of launch it was. This most likely does not cover all cases and may sometimes return warm when it was actually cold
  private func getAppLaunchType() -> AppLaunchType {
    // `ActivePrewarm` flag was set => prewarmed launch
    if AppLoadTimeProvider.wasPrewarmActive() {
      return .prewarmed
    }

    // No previous state set => cold launch
    guard let previousAppLaunchState = AppMetricsUserDefaults.lastAppLaunchState else {
      return .cold
    }

    // App has been updated => cold launch
    if appLaunchState.buildNumber != previousAppLaunchState.buildNumber {
      return .cold
    }

    // Launches from Xcode are the coldest. There is no reliable solution to detect
    // if the app is launched from Xcode that works in both debug and release modes,
    // so we are assuming that if the debugger is attached, it was probably launched from Xcode.
    if isatty(STDERR_FILENO) != 0 {
      return .cold
    }

    // The same boot time => probably warm launch
    // Boot times may differ slightly when the device's timezone has changed.
    // It's usually less than 100ms, but since the restart takes a few seconds we can use safer threshold.
    if abs(appLaunchState.bootTime - previousAppLaunchState.bootTime) < 1.0 {
      return .warm
    }
    return .cold
  }
}

/// A value guarded by a lock, for state shared with threads that can't hop onto the actor.
private final class LockedValue<T>: @unchecked Sendable {
  private let lock = NSLock()
  private var storage: T

  init(_ value: T) {
    storage = value
  }

  var value: T {
    get {
      lock.lock()
      defer { lock.unlock() }
      return storage
    }
    set {
      lock.lock()
      storage = newValue
      lock.unlock()
    }
  }
}
