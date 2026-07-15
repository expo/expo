import Foundation

final class AppStartupMarkers: Sendable {
  let loadTime: TimeInterval = AppLoadTimeProvider.getLoadTime()

  @AppMetricsActor
  var main: TimeInterval?

  @AppMetricsActor
  var finishedLaunching: TimeInterval?

  /// Wall-clock companion to `finishedLaunching`. `NetworkRequest.timings.fetchStart` uses `Date`
  /// (not `CACurrentMediaTime`) so summarizing requests over the launch window needs an anchor in
  /// the same domain.
  @AppMetricsActor
  var finishedLaunchingDate: Date?

  @AppMetricsActor
  var timeToFirstRender: TimeInterval?

  @AppMetricsActor
  var timeToInteractive: TimeInterval?

  /// Time of loading dylibs and executing static initializers such as Objective-C `load`/`initialize` methods.
  /// This is what happens before the `main` application's function is called.
  @AppMetricsActor
  func getLoadTime() -> TimeInterval? {
    return loadTime
  }

  /// The launch time consists of:
  /// - load time (see `getLoadTime`)
  /// - `main` function
  /// - creation of application's window or scene (`application:didFinishLaunchingWithOptions:`)
  /// - initialization of the React Native instance
  /// - execution of some lifecycle events from the AppDelegate subscribers
  @AppMetricsActor
  func getLaunchTime() -> TimeInterval? {
    if let main, let finishedLaunching {
      return loadTime + finishedLaunching - main
    }
    return nil
  }

  @AppMetricsActor
  func getTTFR() -> TimeInterval? {
    if let finishedLaunching, let timeToFirstRender {
      return timeToFirstRender - finishedLaunching
    }
    return nil
  }

  @AppMetricsActor
  func getTTI() -> TimeInterval? {
    if let finishedLaunching, let timeToInteractive {
      return timeToInteractive - finishedLaunching
    }
    return nil
  }

  func getBundleLoadTime() -> TimeInterval? {
    // TODO(@tsapeta): React Native 0.87 removed `StartupLogger::getRunJSBundleEndTime()`, so
    // `ReactMarker.getRunJSBundleEndTime()` currently returns NaN and the bundle load duration
    // cannot be measured. Returning nil keeps NaN out of the serialized metrics payload.
    return nil
  }
}

struct AppStartupTimes: Metrics {
  static let category: Metric.Category? = .appStartup

  enum MetricKeys: String, MetricKey {
    case loadTime
    case launchTime
    case timeToFirstRender
    case timeToInteractive
    case bundleLoadTime
  }

  let loadTime: TimeInterval?
  let launchTime: TimeInterval?
  let timeToFirstRender: TimeInterval?
  let timeToInteractive: TimeInterval?
  let bundleLoadTime: TimeInterval?
}
