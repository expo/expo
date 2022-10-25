import ABI47_0_0ExpoModulesCore

let batteryLevelDidChange: String = "Expo.batteryLevelDidChange"
let batteryStateDidChange: String = "Expo.batteryStateDidChange"
let powerModeDidChange: String = "Expo.powerModeDidChange"

public class BatteryModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoBattery")

    Constants([
      "isSupported": isSupported()
    ])

    Events(batteryLevelDidChange, batteryStateDidChange, powerModeDidChange)

    AsyncFunction("getBatteryLevelAsync") { () -> Float in
      return UIDevice.current.batteryLevel
    }

    AsyncFunction("isLowPowerModeEnabledAsync") { () -> Bool in
      return ProcessInfo.processInfo.isLowPowerModeEnabled
    }

    AsyncFunction("getBatteryStateAsync") { () -> Int in
      // Apple's enum values directly correspond to Expo's
      // enum values for battery state and are in sync, so
      // we can return the rawValue from Apple's enum directly
      return UIDevice.current.batteryState.rawValue
    }

    OnCreate {
      UIDevice.current.isBatteryMonitoringEnabled = true
    }

    OnDestroy {
      UIDevice.current.isBatteryMonitoringEnabled = false
    }

    OnStartObserving {
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.batteryLevelListener),
        name: UIDevice.batteryLevelDidChangeNotification,
        object: nil
      )

      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.batteryStateListener),
        name: UIDevice.batteryStateDidChangeNotification,
        object: nil
      )

      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.powerModeListener),
        name: Notification.Name.NSProcessInfoPowerStateDidChange,
        object: nil
      )
    }

    OnStopObserving {
      NotificationCenter.default.removeObserver(self, name: UIDevice.batteryLevelDidChangeNotification, object: nil)
      NotificationCenter.default.removeObserver(self, name: UIDevice.batteryStateDidChangeNotification, object: nil)
      NotificationCenter.default.removeObserver(self, name: Notification.Name.NSProcessInfoPowerStateDidChange, object: nil)
    }
  }

  @objc
  func batteryLevelListener() {
    sendEvent(batteryLevelDidChange, [
      "batteryLevel": UIDevice.current.batteryLevel
    ])
  }

  @objc
  func batteryStateListener() {
    sendEvent(batteryStateDidChange, [
      "batteryState": UIDevice.current.batteryState.rawValue
    ])
  }

  @objc
  func powerModeListener() {
    sendEvent(powerModeDidChange, [
      "lowPowerMode": ProcessInfo.processInfo.isLowPowerModeEnabled
    ])
  }
}

func isSupported() -> Bool {
  #if targetEnvironment(simulator)
    return false
  #else
    return true
  #endif
}
