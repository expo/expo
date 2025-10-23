import ExpoModulesCore
import UIKit
import MachO

public class DeviceModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoDevice")

    Constant("isDevice") {
      isDevice()
    }

    Constant("brand") {
      "Apple"
    }

    Constant("manufacturer") {
      "Apple"
    }

    Constant("modelId") {
      UIDevice.modelIdentifier
    }

    Constant("modelName") {
      UIDevice.DeviceMap.modelName
    }

    Constant("deviceYearClass") {
      UIDevice.DeviceMap.deviceYearClass
    }

    Constant("totalMemory") {
      ProcessInfo.processInfo.physicalMemory
    }

    Constant("osName") {
      UIDevice.current.systemName
    }

    Constant("osVersion") {
      UIDevice.current.systemVersion
    }

    Constant("osBuildId") {
      osBuildId()
    }

    Constant("osInternalBuildId") {
      osBuildId()
    }

    Constant("deviceName") {
      UIDevice.current.name
    }

    Constant("deviceType") {
      getDeviceType()
    }

    Constant("supportedCpuArchitectures") {
      cpuArchitectures()
    }

    AsyncFunction("getDeviceTypeAsync") { () -> Int in
      return getDeviceType()
    }

    AsyncFunction("getUptimeAsync") { () -> Double in
      // Uses required reason API based on the following reason: 35F9.1 – there's not really a matching reason here
      return ProcessInfo.processInfo.systemUptime * 1000
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
  if #available(iOS 14.0, tvOS 14.0, *) {
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
