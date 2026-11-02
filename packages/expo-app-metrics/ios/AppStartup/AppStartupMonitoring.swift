// Copyright 2025-present 650 Industries. All rights reserved.

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
      }
    }
  }

  let frameMetricsRecorder = FrameMetricsRecorder()

  lazy var appLaunchState = AppLaunchState()

  lazy var launchType: AppLaunchType = getAppLaunchType()

  nonisolated func markMain() {
    if launchType == .prewarmed {
      return
    }
    let currentTime = CACurrentMediaTime()

    AppMetricsActor.isolated { [self] in
      markers.main = currentTime
    }
  }

  /// - Parameter runningInBackground: Whether the app is running in the background. Tests pass it explicitly.
  @MainActor
  func markDidFinishLaunching(runningInBackground: Bool = AppStartupMonitoring.isRunningInBackground()) {
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
      // The system may launch the app in the background, for example for a background fetch or a silent push notification.
      // Such launches are interrupted right away, otherwise TTR and TTI would include the whole time until the user opens the app.
      if runningInBackground {
        startupState = .interrupted
        return
      }
      markers.finishedLaunching = currentTime
      markers.finishedLaunchingDate = currentDate

      // Start tracking frame metrics from this point so the data
      // matches the TTI window (finishedLaunching → markInteractive).
      frameMetricsRecorder.start()

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

      if let ttfr = markers.getTTFR(), ttfr > Self.maxStartupDuration {
        startupState = .interrupted
        return
      }

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

      if let tti = markers.getTTI() {
        if tti > Self.maxStartupDuration {
          startupState = .interrupted
          return
        }
        let frameMetrics = frameMetricsRecorder.stop()
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
          networkRequests: networkRequests
        )
        let metric = Metric(
          category: .appStartup,
          name: "timeToInteractive",
          value: tti,
          routeName: routeName,
          params: mergedParams.isEmpty ? nil : mergedParams
        )
        reportMetric(metric)
        AppMetricsUserDefaults.hasMarkedInteractive = true
      }
      startupState = .launched
    }
  }

  /// Interrupts the startup if it is still in progress when the app enters the background.
  /// Returns the `expo.app_startup.backgrounded` event for a foreground launch that the user left before TTI,
  /// for example because the app was stuck on the splash screen.
  @AppMetricsActor
  func markEnteredBackground(at currentTime: TimeInterval = CACurrentMediaTime()) -> LogRecord? {
    if startupState != .launching {
      return nil
    }
    startupState = .interrupted

    // Prewarmed launches have no `finishedLaunching` marker.
    guard let finishedLaunching = markers.finishedLaunching else {
      return nil
    }
    let duration = currentTime - finishedLaunching
    if duration > Self.maxStartupDuration {
      return nil
    }
    return makeStartupBackgroundedLogRecord(
      duration: duration,
      hasRendered: markers.timeToFirstRender != nil,
      hasMarkedInteractive: AppMetricsUserDefaults.hasMarkedInteractive
    )
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

  // MARK: - Background launches

  /// TTR and TTI longer than this are dropped. It is a safety guard for background launches that
  /// `isRunningInBackground` doesn't detect, as their startup times include the whole time until the user opens the app.
  private static let maxStartupDuration: TimeInterval = 3 * 60

  /// Background launches got about 30 seconds in our tests. Apple only documents the foreground value as
  /// "suitably large", so we compare against a threshold rather than `greatestFiniteMagnitude`.
  private static let backgroundTimeRemainingThreshold: TimeInterval = 60 * 60

  /// Returns whether the app is currently running in the background.
  ///
  /// `UIApplication.applicationState` can't be used here, because apps using the scene-based life cycle report
  /// `.background` in `didFinishLaunching` even when the user launches them from the home screen.
  /// In the foreground there is no limit on the background execution time, so `backgroundTimeRemaining` is very large.
  @MainActor
  private static func isRunningInBackground() -> Bool {
    return UIApplication.shared.backgroundTimeRemaining < backgroundTimeRemainingThreshold
  }
}

/// Builds the internal `expo.app_startup.backgrounded` log event emitted when the user leaves the app before TTI.
/// - `expo.app_startup.duration`: seconds from the end of the native launch until the app entered the background.
/// - `expo.app_startup.hasRendered`: whether the first render happened. When `false`, the user probably saw only the splash screen.
/// - `expo.app_startup.hasMarkedInteractive`: whether the app reached TTI in an earlier launch. When `false`, the app
///   probably doesn't call `markInteractive`, so the event doesn't tell that the startup didn't finish.
///
/// Emitted via `receiveLog` directly rather than the JS `logEvent` path, so the SDK-reserved `expo.`
/// event name and attribute keys bypass the validation that would otherwise drop them.
func makeStartupBackgroundedLogRecord(
  duration: TimeInterval,
  hasRendered: Bool,
  hasMarkedInteractive: Bool
) -> LogRecord {
  return LogRecord(
    name: "expo.app_startup.backgrounded",
    attributes: [
      "expo.app_startup.duration": duration,
      "expo.app_startup.hasRendered": hasRendered,
      "expo.app_startup.hasMarkedInteractive": hasMarkedInteractive,
    ]
  )
}
