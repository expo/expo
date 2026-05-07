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

  nonisolated func markDidFinishLaunching() {
    // App has finished loading – save the current app launch state
    AppMetricsUserDefaults.lastAppLaunchState = appLaunchState

    if launchType == .prewarmed {
      return
    }
    let currentTime = CACurrentMediaTime()

    AppMetricsActor.isolated { [self] in
      if startupState != .launching {
        return
      }
      markers.finishedLaunching = currentTime

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
        var params = params
        let frameMetrics = frameMetricsRecorder.stop()
        if frameMetrics.expectedFrames > 0 {
          params["expo.frameRate.slowFrames"] = frameMetrics.slowFrames
          params["expo.frameRate.frozenFrames"] = frameMetrics.frozenFrames
          params["expo.frameRate.totalDelay"] = frameMetrics.freezeTime
        }
        for (key, value) in await DeviceConditions.deviceParams() {
          params[key] = value
        }
        for (key, value) in await DeviceConditions.networkParams() {
          params[key] = value
        }
        let metric = Metric(
          category: .appStartup,
          name: "timeToInteractive",
          value: tti,
          routeName: routeName,
          params: params.isEmpty ? nil : params
        )
        reportMetric(metric)
      }
      startupState = .launched
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
    /**
     The app is launched from scratch. The system must allocate memory, start a fresh runtime environment,
     load the app's code and resources from disk, and initialize its components before rendering the UI.
     This is the slowest type of launch and typically occurs after a fresh install, reboot,
     or when the OS has killed the app to reclaim memory
     */
    case cold
    /**
     The app's main process is still running in memory, but the UI and navigation state have been torn down.
     The system does not need to restart the app process or reinitialize the runtime environment,
     but it must recreate the app's interface and restore any preserved state.
     This often happens when the app is in a background state and the system has cleared its UI to free up memory.
     */
    case warm
    /**
     The system prewarmed the app, partially running its launch sequence in the background before the user opens it.
     In this case we can't reliably measure app startup times, so we do not collect these metrics.
     */
    case prewarmed
  }

  /**
   Tries to guess what type of launch it was. This most likely does not cover all cases and may sometimes return warm when it was actually cold
   */
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
