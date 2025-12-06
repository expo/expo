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

    /**
     * getCameraCutoutInfoAsync (iOS)
     *
     * Returns camera-cutout-only information (focused on camera notch / cutout geometry).
     *
     * {
     *   hasCameraCutout: Bool,
     *   cameraRects: [ { x: Int, y: Int, width: Int, height: Int, radius: Int? } ],
     *   safeInsets: { top: Int, bottom: Int, left: Int, right: Int },
     *   type: String // "hole" | "pill" | "wide" | "unknown"
     * }
     *
     * Notes:
     * - iOS does not expose exact hardware cutout bounding paths. We approximate using safeAreaInsets
     *   + device geometry and return a bounding rect that covers the camera / notch area.
     * - Values are returned in physical pixels (points * screen.scale) for parity with Android.
     */
    AsyncFunction("getCameraCutoutInfoAsync") { () -> [String: Any] in
      // helper: current key window (iOS 13+ compatible)
      func currentKeyWindow() -> UIWindow? {
        // prefer modern API
        if #available(iOS 13.0, *) {
          let scenes = UIApplication.shared.connectedScenes
          let windowScene = scenes.first { $0.activationState == .foregroundActive } as? UIWindowScene
          return windowScene?.windows.first(where: { $0.isKeyWindow }) ?? UIApplication.shared.windows.first(where: { $0.isKeyWindow })
        } else {
          return UIApplication.shared.keyWindow
        }
      }

      // default result
      let defaultResult: [String: Any] = [
        "hasCameraCutout": false,
        "cameraRects": [[String: Any]](),
        "safeInsets": ["top": 0, "bottom": 0, "left": 0, "right": 0],
        "type": "unknown"
      ]

      guard let window = currentKeyWindow() else {
        return defaultResult
      }

      let insets = window.safeAreaInsets
      let screenBounds = UIScreen.main.bounds
      let scale = UIScreen.main.scale

      // convert to physical pixels (Int)
      let topPx = Int((insets.top) * scale)
      let bottomPx = Int((insets.bottom) * scale)
      let leftPx = Int((insets.left) * scale)
      let rightPx = Int((insets.right) * scale)
      let screenWidthPx = Int(screenBounds.width * scale)
      let screenHeightPx = Int(screenBounds.height * scale)

      // Build a heuristic bounding rect for the camera cutout:
      // On iOS the notch/dynamic island influences the top safe inset.
      // We'll assume camera cutout sits in the top safe area and spans the usable width (minus side insets).
      let notchHeightPx = topPx
      let notchX = leftPx
      let notchY = 0 // notch always starts at the top edge visually
      let notchWidthPx = max(0, screenWidthPx - leftPx - rightPx)
      let notchHeight = max(0, notchHeightPx)

      // If there is no top inset, assume no visible camera cutout exposed to apps (e.g., older devices)
      if notchHeight == 0 || notchWidthPx == 0 {
        return [
          "hasCameraCutout": false,
          "cameraRects": [[String: Any]](),
          "safeInsets": ["top": topPx, "bottom": bottomPx, "left": leftPx, "right": rightPx],
          "type": "unknown"
        ]
      }

      // Decide shape & radius heuristic:
      // - If width / height ~ 1 -> hole (circular)
      // - If width / height between 1.2..3 -> pill
      // - If width / height > 3 -> wide notch
      let ratio = Double(notchWidthPx) / max(1.0, Double(notchHeight))
      var typeGuess = "unknown"
      if ratio <= 1.2 {
        typeGuess = "hole"
      } else if ratio <= 3.0 {
        typeGuess = "pill"
      } else {
        typeGuess = "wide"
      }

      // radius estimate (in pixels); nil if uncertain
      let radiusEstimate: Int?
      if typeGuess == "hole" {
        // circular-ish: radius ~= width/2
        radiusEstimate = Int(Double(notchWidthPx) / 2.0)
      } else if typeGuess == "pill" {
        // pill: corner radius ~ height/2
        radiusEstimate = Int(Double(notchHeight) / 2.0)
      } else {
        radiusEstimate = nil
      }

      // Compose camera rect (x,y,width,height) in pixels
      let cameraRect: [String: Any] = [
        "x": notchX,
        "y": notchY,
        "width": notchWidthPx,
        "height": notchHeight,
        "radius": radiusEstimate as Any
      ]

      return [
        "hasCameraCutout": true,
        "cameraRects": [cameraRect],
        "safeInsets": ["top": topPx, "bottom": bottomPx, "left": leftPx, "right": rightPx],
        "type": typeGuess
      ]
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
