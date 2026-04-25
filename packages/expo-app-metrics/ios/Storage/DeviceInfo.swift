import SystemConfiguration

/**
 Provides some basic informations about the device.
 */
public struct DeviceInfo: Codable, Equatable, Sendable {
  public let modelName: String
  public let modelIdentifier: String
  public let systemName: String
  public let systemVersion: String

  static let current: DeviceInfo = {
    return MainActor.runSynchronously {
      let device = UIDevice.current

      return DeviceInfo(
        modelName: getDeviceModelName(device: device),
        modelIdentifier: getDeviceModelIdentifier() ?? device.model,
        systemName: device.systemName,
        systemVersion: device.systemVersion
      )
    }
  }()
}

/**
 Returns a device model name, e.g. "iPhone", "iPad" or "iPhone (Simulator)" when the app is running on the simulator.
 */
@MainActor
private func getDeviceModelName(device: UIDevice) -> String {
  #if targetEnvironment(simulator)
  return "\(device.model) (Simulator)"
  #else
  return device.model
  #endif
}

/**
 Returns an identifier of the device model, e.g. "iPhone18,2".
 */
private func getDeviceModelIdentifier() -> String? {
  #if targetEnvironment(simulator)
  return ProcessInfo().environment["SIMULATOR_MODEL_IDENTIFIER"]
  #else
  var systemInfo = utsname()
  uname(&systemInfo)
  let machineMirror = Mirror(reflecting: systemInfo.machine)
  return machineMirror.children.reduce("") { identifier, element in
    guard let value = element.value as? Int8, value != 0 else {
      return identifier
    }
    return identifier + String(UnicodeScalar(UInt8(value)))
  }
  #endif
}

extension MainActor {
  @preconcurrency
  static func runSynchronously<R: Sendable>(_ body: @MainActor () -> R) -> R {
    if Thread.isMainThread {
      return MainActor.assumeIsolated(body)
    }
    return DispatchQueue.main.sync(execute: body)
  }
}
