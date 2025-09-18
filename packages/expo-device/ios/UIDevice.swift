import UIKit

struct ExpoDeviceType {
  let modelName: String
  let deviceYearClass: Int?
}

public extension UIDevice {
  // Credit: https://stackoverflow.com/a/26962452
  // Added support for iPhone 17 from https://deviceatlas.com/resources/clientside/ios-hardware-identification
  // and https://gist.github.com/adamawolf/3048717
  static let modelIdentifier: String = {
    var systemInfo = utsname()
    uname(&systemInfo)
    let machineMirror = Mirror(reflecting: systemInfo.machine)
    return machineMirror.children.reduce("") { identifier, element in
      guard let value = element.value as? Int8, value != 0 else {
        return identifier
      }
      return identifier + String(UnicodeScalar(UInt8(value)))
    }
  }()

  // swiftlint:disable closure_body_length
  static internal let DeviceMap: ExpoDeviceType = {
    func mapToDevice(identifier: String) -> ExpoDeviceType {
      let currentYear = Calendar(identifier: .gregorian).dateComponents([.year], from: Date()).year

#if os(iOS)
      switch identifier {
      case "iPod9,1":
        return ExpoDeviceType(modelName: "iPod touch (7th generation)", deviceYearClass: 2019)
      case "iPhone8,1":
        return ExpoDeviceType(modelName: "iPhone 6s", deviceYearClass: 2015)
      case "iPhone8,2":
        return ExpoDeviceType(modelName: "iPhone 6s Plus", deviceYearClass: 2015)
      case "iPhone9,1", "iPhone9,3":
        return ExpoDeviceType(modelName: "iPhone 7", deviceYearClass: 2016)
      case "iPhone9,2", "iPhone9,4":
        return ExpoDeviceType(modelName: "iPhone 7 Plus", deviceYearClass: 2016)
      case "iPhone10,1", "iPhone10,4":
        return ExpoDeviceType(modelName: "iPhone 8", deviceYearClass: 2017)
      case "iPhone10,2", "iPhone10,5":
        return ExpoDeviceType(modelName: "iPhone 8 Plus", deviceYearClass: 2017)
      case "iPhone10,3", "iPhone10,6":
        return ExpoDeviceType(modelName: "iPhone X", deviceYearClass: 2017)
      case "iPhone11,2":
        return ExpoDeviceType(modelName: "iPhone XS", deviceYearClass: 2018)
      case "iPhone11,4", "iPhone11,6":
        return ExpoDeviceType(modelName: "iPhone XS Max", deviceYearClass: 2018)
      case "iPhone11,8":
        return ExpoDeviceType(modelName: "iPhone XR", deviceYearClass: 2018)
      case "iPhone12,1":
        return ExpoDeviceType(modelName: "iPhone 11", deviceYearClass: 2019)
      case "iPhone12,3":
        return ExpoDeviceType(modelName: "iPhone 11 Pro", deviceYearClass: 2019)
      case "iPhone12,5":
        return ExpoDeviceType(modelName: "iPhone 11 Pro Max", deviceYearClass: 2019)
      case "iPhone13,1":
        return ExpoDeviceType(modelName: "iPhone 12 mini", deviceYearClass: 2020)
      case "iPhone13,2":
        return ExpoDeviceType(modelName: "iPhone 12", deviceYearClass: 2020)
      case "iPhone13,3":
        return ExpoDeviceType(modelName: "iPhone 12 Pro", deviceYearClass: 2020)
      case "iPhone13,4":
        return ExpoDeviceType(modelName: "iPhone 12 Pro Max", deviceYearClass: 2020)
      case "iPhone14,4":
        return ExpoDeviceType(modelName: "iPhone 13 mini", deviceYearClass: 2021)
      case "iPhone14,5":
        return ExpoDeviceType(modelName: "iPhone 13", deviceYearClass: 2021)
      case "iPhone14,2":
        return ExpoDeviceType(modelName: "iPhone 13 Pro", deviceYearClass: 2021)
      case "iPhone14,3":
        return ExpoDeviceType(modelName: "iPhone 13 Pro Max", deviceYearClass: 2021)
      case "iPhone14,7":
        return ExpoDeviceType(modelName: "iPhone 14", deviceYearClass: 2022)
      case "iPhone14,8":
        return ExpoDeviceType(modelName: "iPhone 14 Plus", deviceYearClass: 2022)
      case "iPhone15,2":
        return ExpoDeviceType(modelName: "iPhone 14 Pro", deviceYearClass: 2022)
      case "iPhone15,3":
        return ExpoDeviceType(modelName: "iPhone 14 Pro Max", deviceYearClass: 2022)
      case "iPhone15,4":
        return ExpoDeviceType(modelName: "iPhone 15", deviceYearClass: 2023)
      case "iPhone15,5":
        return ExpoDeviceType(modelName: "iPhone 15 Plus", deviceYearClass: 2023)
      case "iPhone16,1":
        return ExpoDeviceType(modelName: "iPhone 15 Pro", deviceYearClass: 2023)
      case "iPhone16,2":
        return ExpoDeviceType(modelName: "iPhone 15 Pro Max", deviceYearClass: 2023)
      case "iPhone17,3":
        return ExpoDeviceType(modelName: "iPhone 16", deviceYearClass: 2024)
      case "iPhone17,4":
        return ExpoDeviceType(modelName: "iPhone 16 Plus", deviceYearClass: 2024)
      case "iPhone17,1":
        return ExpoDeviceType(modelName: "iPhone 16 Pro", deviceYearClass: 2024)
      case "iPhone17,2":
        return ExpoDeviceType(modelName: "iPhone 16 Pro Max", deviceYearClass: 2024)
      case "iPhone18,1":
        return ExpoDeviceType(modelName: "iPhone 17 Pro", deviceYearClass: 2025)
      case "iPhone18,2":
        return ExpoDeviceType(modelName: "iPhone 17 Pro Max", deviceYearClass: 2025)
      case "iPhone18,3":
        return ExpoDeviceType(modelName: "iPhone 17", deviceYearClass: 2025)
      case "iPhone18,4":
        return ExpoDeviceType(modelName: "iPhone Air", deviceYearClass: 2025)
      case "iPhone8,4":
        return ExpoDeviceType(modelName: "iPhone SE", deviceYearClass: 2016)
      case "iPhone12,8":
        return ExpoDeviceType(modelName: "iPhone SE (2nd generation)", deviceYearClass: 2020)
      case "iPhone14,6":
        return ExpoDeviceType(modelName: "iPhone SE (3rd generation)", deviceYearClass: 2022)
      case "iPad6,11", "iPad6,12":
        return ExpoDeviceType(modelName: "iPad (5th generation)", deviceYearClass: 2017)
      case "iPad7,5", "iPad7,6":
        return ExpoDeviceType(modelName: "iPad (6th generation)", deviceYearClass: 2018)
      case "iPad7,11", "iPad7,12":
        return ExpoDeviceType(modelName: "iPad (7th generation)", deviceYearClass: 2019)
      case "iPad11,6", "iPad11,7":
        return ExpoDeviceType(modelName: "iPad (8th generation)", deviceYearClass: 2020)
      case "iPad12,1", "iPad12,2":
        return ExpoDeviceType(modelName: "iPad (9th generation)", deviceYearClass: 2021)
      case "iPad13,18", "iPad13,19":
        return ExpoDeviceType(modelName: "iPad (10th generation)", deviceYearClass: 2022)
      case "iPad5,3", "iPad5,4":
        return ExpoDeviceType(modelName: "iPad Air 2", deviceYearClass: 2014)
      case "iPad11,3", "iPad11,4":
        return ExpoDeviceType(modelName: "iPad Air (3rd generation)", deviceYearClass: 2019)
      case "iPad13,1", "iPad13,2":
        return ExpoDeviceType(modelName: "iPad Air (4th generation)", deviceYearClass: 2020)
      case "iPad13,16", "iPad13,17":
        return ExpoDeviceType(modelName: "iPad Air (5th generation)", deviceYearClass: 2022)
      case "iPad14,8", "iPad14,9":
        return ExpoDeviceType(modelName: "iPad Air (11-inch) (6th generation)", deviceYearClass: 2024)
      case "iPad 14,10", "iPad 14,11":
        return ExpoDeviceType(modelName: "iPad Air (13-inch) (6th generation)", deviceYearClass: 2024)
      case "iPad5,1", "iPad5,2":
        return ExpoDeviceType(modelName: "iPad mini 4", deviceYearClass: 2015)
      case "iPad11,1", "iPad11,2":
        return ExpoDeviceType(modelName: "iPad mini (5th generation)", deviceYearClass: 2019)
      case "iPad14,1", "iPad14,2":
        return ExpoDeviceType(modelName: "iPad mini (6th generation)", deviceYearClass: 2021)
      case "iPad6,3", "iPad6,4":
        return ExpoDeviceType(modelName: "iPad Pro (9.7-inch)", deviceYearClass: 2016)
      case "iPad7,3", "iPad7,4":
        return ExpoDeviceType(modelName: "iPad Pro (10.5-inch)", deviceYearClass: 2017)
      case "iPad8,1", "iPad8,2", "iPad8,3", "iPad8,4":
        return ExpoDeviceType(modelName: "iPad Pro (11-inch) (1st generation)", deviceYearClass: 2018)
      case "iPad8,9", "iPad8,10":
        return ExpoDeviceType(modelName: "iPad Pro (11-inch) (2nd generation)", deviceYearClass: 2020)
      case "iPad13,4", "iPad13,5", "iPad13,6", "iPad13,7":
        return ExpoDeviceType(modelName: "iPad Pro (11-inch) (3rd generation)", deviceYearClass: 2021)
      case "iPad14,3-A", "iPad14,3-B", "iPad14,4-A", "iPad14,4-B":
        return ExpoDeviceType(modelName: "iPad Pro (11-inch) (4rd generation)", deviceYearClass: 2022)
      case "iPad6,7", "iPad6,8":
        return ExpoDeviceType(modelName: "iPad Pro (12.9-inch) (1st generation)", deviceYearClass: 2015)
      case "iPad7,1", "iPad7,2":
        return ExpoDeviceType(modelName: "iPad Pro (12.9-inch) (2nd generation)", deviceYearClass: 2017)
      case "iPad8,5", "iPad8,6", "iPad8,7", "iPad8,8":
        return ExpoDeviceType(modelName: "iPad Pro (12.9-inch) (3rd generation)", deviceYearClass: 2018)
      case "iPad8,11", "iPad8,12":
        return ExpoDeviceType(modelName: "iPad Pro (12.9-inch) (4th generation)", deviceYearClass: 2020)
      case "iPad13,8", "iPad13,9", "iPad13,10", "iPad13,11":
        return ExpoDeviceType(modelName: "iPad Pro (12.9-inch) (5th generation)", deviceYearClass: 2021)
      case "iPad14,5-A", "iPad14,5-B", "iPad14,6-A", "iPad14,6-B":
        return ExpoDeviceType(modelName: "iPad Pro (12.9-inch) (6th generation)", deviceYearClass: 2022)
      case "iPad16,3", "iPad16,4":
        return ExpoDeviceType(modelName: "iPad Pro (11-inch) (7th generation)", deviceYearClass: 2024)
      case "iPad16,5", "iPad16,6":
        return ExpoDeviceType(modelName: "iPad Pro (13-inch) (7th generation)", deviceYearClass: 2024)
      case "i386", "x86_64", "arm64":
        return ExpoDeviceType(modelName: "Simulator iOS", deviceYearClass: currentYear)
      default:
        return ExpoDeviceType(modelName: identifier, deviceYearClass: currentYear)
      }
#elseif os(tvOS)
      switch identifier {
      case "AppleTV5,3":
        return ExpoDeviceType(modelName: "Apple TV HD (4th Generation, Siri)", deviceYearClass: 2015)
      case "AppleTV6,2":
        return ExpoDeviceType(modelName: "Apple TV 4K", deviceYearClass: 2017)
      case "i386", "x86_64":
        return ExpoDeviceType(modelName: "Simulator tvOS", deviceYearClass: currentYear)
      default:
        return ExpoDeviceType(modelName: identifier, deviceYearClass: currentYear)
      }
#endif
    }

    return mapToDevice(identifier: modelIdentifier)
  }()
  // swiftlint:enable closure_body_length

  // Credit: https://github.com/developerinsider/isJailBroken/blob/master/IsJailBroken/Extension/UIDevice%2BJailBroken.swift
  var isSimulator: Bool {
#if targetEnvironment(simulator)
    return true
#else
    return false
#endif
  }

  var isJailbroken: Bool {
    if UIDevice.current.isSimulator {
      return false
    }

    return JailbreakHelper.hasCydiaInstalled() || JailbreakHelper.doesContainSuspiciousApps() ||
    JailbreakHelper.doesSuspiciousSystemPathExist() || JailbreakHelper.canEditSystemFiles()
  }
}

// Credit: https://github.com/developerinsider/isJailBroken/blob/master/IsJailBroken/Extension/UIDevice%2BJailBroken.swift
private struct JailbreakHelper {
  static func hasCydiaInstalled() -> Bool {
    if let url = URL(string: "cydia://") {
      return UIApplication.shared.canOpenURL(url)
    }
    return false
  }

  static func doesContainSuspiciousApps() -> Bool {
    for path in suspiciousAppsPathToCheck where FileManager.default.fileExists(atPath: path) {
      return true
    }
    return false
  }

  static func doesSuspiciousSystemPathExist() -> Bool {
    for path in suspiciousSystemPathsToCheck where FileManager.default.fileExists(atPath: path) {
      return true
    }
    return false
  }

  static func canEditSystemFiles() -> Bool {
    let jailbreakText = "Developer Insider"
    do {
      try jailbreakText.write(toFile: jailbreakText, atomically: true, encoding: .utf8)
      return true
    } catch {
      return false
    }
  }

  /**
   Add more paths here to check for jail break
   */
  static var suspiciousAppsPathToCheck: [String] {
    return [
      "/Applications/Cydia.app",
      "/Applications/blackra1n.app",
      "/Applications/FakeCarrier.app",
      "/Applications/Icy.app",
      "/Applications/IntelliScreen.app",
      "/Applications/MxTube.app",
      "/Applications/RockApp.app",
      "/Applications/SBSettings.app",
      "/Applications/WinterBoard.app"
    ]
  }

  static var suspiciousSystemPathsToCheck: [String] {
    return [
      "/Library/MobileSubstrate/DynamicLibraries/LiveClock.plist",
      "/Library/MobileSubstrate/DynamicLibraries/Veency.plist",
      "/private/var/lib/apt",
      "/private/var/lib/apt/",
      "/private/var/lib/cydia",
      "/private/var/mobile/Library/SBSettings/Themes",
      "/private/var/stash",
      "/private/var/tmp/cydia.log",
      "/System/Library/LaunchDaemons/com.ikey.bbot.plist",
      "/System/Library/LaunchDaemons/com.saurik.Cydia.Startup.plist",
      "/usr/bin/sshd",
      "/usr/libexec/sftp-server",
      "/usr/sbin/sshd",
      "/etc/apt",
      "/bin/bash",
      "/Library/MobileSubstrate/MobileSubstrate.dylib"
    ]
  }
}
