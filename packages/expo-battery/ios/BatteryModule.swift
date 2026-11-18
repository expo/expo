import ExpoModulesCore

// The names of the `@Event` properties below. The macro reads the name from the source,
// so the attributes repeat these as string literals.
let batteryLevelDidChange: String = "Expo.batteryLevelDidChange"
let batteryStateDidChange: String = "Expo.batteryStateDidChange"
let powerModeDidChange: String = "Expo.powerModeDidChange"

@Record
struct BatteryLevelEvent {
  var batteryLevel: Float
}

@Record
struct BatteryStateEvent {
  var batteryState: Int
}

@Record
struct PowerModeEvent {
  var lowPowerMode: Bool
}

@ExpoModule("ExpoBattery")
public final class BatteryModule: Module {
  // The notification observers of the events that JavaScript listens to. `didStartListening` and
  // `didStopListening` run on the JavaScript thread, but `willDestroy` can run on any thread.
  private let observers = Mutex<[String: NSObjectProtocol]>([:])

  @JS
  var isSupported: Bool {
    #if targetEnvironment(simulator)
    return false
    #else
    return true
    #endif
  }

  @Event("Expo.batteryLevelDidChange")
  var onBatteryLevelChange: (BatteryLevelEvent) -> Void

  @Event("Expo.batteryStateDidChange")
  var onBatteryStateChange: (BatteryStateEvent) -> Void

  @Event("Expo.powerModeDidChange")
  var onPowerModeChange: (PowerModeEvent) -> Void

  // `UIDevice` is main-actor isolated.
  @JS
  @MainActor
  func getBatteryLevelAsync() async -> Float {
    return UIDevice.current.batteryLevel
  }

  @JS
  func isLowPowerModeEnabledAsync() async -> Bool {
    return ProcessInfo.processInfo.isLowPowerModeEnabled
  }

  @JS
  @MainActor
  func getBatteryStateAsync() async -> Int {
    // Apple's enum values directly correspond to Expo's
    // enum values for battery state and are in sync, so
    // we can return the rawValue from Apple's enum directly
    return UIDevice.current.batteryState.rawValue
  }

  public override func didCreate() {
    DispatchQueue.main.async {
      UIDevice.current.isBatteryMonitoringEnabled = true
    }
  }

  public override func willDestroy() {
    let removedObservers = observers.withLock { observers in
      defer { observers.removeAll() }
      return Array(observers.values)
    }
    for observer in removedObservers {
      NotificationCenter.default.removeObserver(observer)
    }

    DispatchQueue.main.async {
      UIDevice.current.isBatteryMonitoringEnabled = false
    }
  }

  public override func didStartListening(event: String) {
    guard let observer = addObserver(forEvent: event) else {
      return
    }
    let previousObserver = observers.withLock { observers in
      observers.updateValue(observer, forKey: event)
    }
    if let previousObserver {
      NotificationCenter.default.removeObserver(previousObserver)
    }
  }

  public override func didStopListening(event: String) {
    let observer = observers.withLock { observers in
      observers.removeValue(forKey: event)
    }
    if let observer {
      NotificationCenter.default.removeObserver(observer)
    }
  }

  private func addObserver(forEvent event: String) -> NSObjectProtocol? {
    switch event {
    case batteryLevelDidChange:
      return NotificationCenter.default.addObserver(
        forName: UIDevice.batteryLevelDidChangeNotification,
        object: nil,
        queue: .main
      ) { [weak self] _ in
        let batteryLevel = MainActor.assumeIsolated { UIDevice.current.batteryLevel }
        self?.onBatteryLevelChange(BatteryLevelEvent(batteryLevel: batteryLevel))
      }
    case batteryStateDidChange:
      return NotificationCenter.default.addObserver(
        forName: UIDevice.batteryStateDidChangeNotification,
        object: nil,
        queue: .main
      ) { [weak self] _ in
        let batteryState = MainActor.assumeIsolated { UIDevice.current.batteryState.rawValue }
        self?.onBatteryStateChange(BatteryStateEvent(batteryState: batteryState))
      }
    case powerModeDidChange:
      return NotificationCenter.default.addObserver(
        forName: Notification.Name.NSProcessInfoPowerStateDidChange,
        object: nil,
        queue: nil
      ) { [weak self] _ in
        self?.onPowerModeChange(PowerModeEvent(lowPowerMode: ProcessInfo.processInfo.isLowPowerModeEnabled))
      }
    default:
      return nil
    }
  }
}
