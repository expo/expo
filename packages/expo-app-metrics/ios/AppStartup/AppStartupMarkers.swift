final class AppStartupMarkers: Sendable {
  let loadTime: TimeInterval = AppLoadTimeProvider.getLoadTime()

  @AppMetricsActor
  var main: TimeInterval?

  @AppMetricsActor
  var finishedLaunching: TimeInterval?

  @AppMetricsActor
  var timeToFirstRender: TimeInterval?

  @AppMetricsActor
  var timeToInteractive: TimeInterval?

  /**
   Time of loading dylibs and executing static initializers such as Objective-C `load`/`initialize` methods.
   This is what happens before the `main` application's function is called.
   */
  @AppMetricsActor
  func getLoadTime() -> TimeInterval? {
    return loadTime
  }

  /**
   The launch time consists of:
   - load time (see `getLoadTime`)
   - `main` function
   - creation of application's window or scene (`application:didFinishLaunchingWithOptions:`)
   - initialization of the React Native instance
   - execution of some lifecycle events from the AppDelegate subscribers
   */
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
    let bundleStartTime = ReactMarker.getRunJSBundleStartTime()
    let bundleEndTime = ReactMarker.getRunJSBundleEndTime()
    return (bundleEndTime - bundleStartTime) / 1000
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
