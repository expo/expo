import ExpoModulesCore
import UIKit
import MachO

public class DeviceModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoDevice")

    Constants([
      "isDevice": isDevice(),
      "brand": "Apple",
      "manufacturer": "Apple",
      "modelId": UIDevice.modelIdentifier,
      "modelName": UIDevice.DeviceMap.modelName,
      "deviceYearClass": UIDevice.DeviceMap.deviceYearClass,
      "totalMemory": ProcessInfo.processInfo.physicalMemory,
      "osName": UIDevice.current.systemName,
      "osVersion": UIDevice.current.systemVersion,
      "osBuildId": osBuildId(),
      "osInternalBuildId": osBuildId(),
      "deviceName": UIDevice.current.name,
      "deviceType": getDeviceType(),
      "supportedCpuArchitectures": cpuArchitectures()
    ])

    AsyncFunction("getDeviceTypeAsync") { () -> Int in
      return getDeviceType()
    }

    AsyncFunction("getUptimeAsync") { () -> Double in
      let uptimeMs: Double = ProcessInfo.processInfo.systemUptime * 1000

      return uptimeMs
    }

    AsyncFunction("isRootedExperimentalAsync") { () -> Bool in
      return UIDevice.current.isJailbroken
    }
  }
}

func getDeviceType() -> Int {
  // if it's a macOS Catalyst app
  if ProcessInfo.processInfo.isMacCatalystApp {
    return DeviceType.desktop.rawValue
  }

  // if it's built for iPad running on a Mac
  if #available(iOS 14.0, *) {
    if ProcessInfo.processInfo.isiOSAppOnMac {
      return DeviceType.desktop.rawValue
    }
  }

  switch UIDevice.current.userInterfaceIdiom {
  case UIUserInterfaceIdiom.phone:
    return DeviceType.phone.rawValue
  case UIUserInterfaceIdiom.pad:
    return DeviceType.tablet.rawValue
  case UIUserInterfaceIdiom.tv:
    return DeviceType.tv.rawValue
  default:
    return DeviceType.unknown.rawValue
  }
}

func isDevice() -> Bool {
  #if targetEnvironment(simulator)
  return false
  #else
  return true
  #endif
}

func osBuildId() -> String? {
  #if os(tvOS)
  return nil
  #else
  // Credit: https://stackoverflow.com/a/65858410
  var mib: [Int32] = [CTL_KERN, KERN_OSVERSION]
  let namelen = UInt32(MemoryLayout.size(ofValue: mib) / MemoryLayout.size(ofValue: mib[0]))
  var bufferSize = 0

  // Get the size for the buffer
  sysctl(&mib, namelen, nil, &bufferSize, nil, 0)

  var buildBuffer = [UInt8](repeating: 0, count: bufferSize)
  let result = sysctl(&mib, namelen, &buildBuffer, &bufferSize, nil, 0)

  if result >= 0 && bufferSize > 0 {
    return String(bytesNoCopy: &buildBuffer, length: bufferSize - 1, encoding: .utf8, freeWhenDone: false)
  }

  return nil
  #endif
}

func cpuArchitectures() -> [String]? {
  // Credit: https://stackoverflow.com/a/70134518
  guard let archRaw = NXGetLocalArchInfo().pointee.name else {
    return nil
  }
  return [String(cString: archRaw)]
}

enum DeviceType: Int {
  case unknown = 0
  case phone = 1
  case tablet = 2
  case desktop = 3
  case tv = 4
}
