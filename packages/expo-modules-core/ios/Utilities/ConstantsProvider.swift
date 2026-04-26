// Copyright 2025-present 650 Industries. All rights reserved.

internal final class ConstantsProvider: EXConstantsInterface {
  nonisolated(unsafe) static let shared = ConstantsProvider()

  func constants() -> [AnyHashable: Any] {
    // Some constants can be safely read only on the main thread
    let (statusBarHeight, deviceName, systemFonts) = performSynchronouslyOnMainActor {
      return (
        getStatusBarHeight(),
        getDeviceName(),
        getSystemFontNames()
      )
    }
    #if DEBUG
    let isDebugXcodeScheme = true
    #else
    let isDebugXcodeScheme = false
    #endif

    var result: [AnyHashable: Any] = [
      "sessionId": UUID().uuidString,
      "executionEnvironment": "bare",
      "statusBarHeight": statusBarHeight,
      "deviceName": deviceName,
      "systemFonts": systemFonts,
      "debugMode": isDebugXcodeScheme,
      "isHeadless": false,
      "platform": [
        "ios": [
          "buildNumber": getBuildVersion() ?? ""
        ]
      ]
    ]
    // Deprecated, but still used internally. We need to check if the manifest is set, otherwise it will result in 
    // an error where the whole manifest is null since we cannot wrap an Optional null in JS correctly.
    if let manifest = getManifest() {
      result["manifest"] = manifest
    }
    return result
  }
}

private func getBuildVersion() -> String? {
  return Bundle.main.infoDictionary?["CFBundleVersion"] as? String
}

@MainActor
private func getStatusBarHeight() -> Double {
  #if os(iOS)
  let statusBarSize = UIApplication.shared.statusBarFrame.size
  return min(statusBarSize.width, statusBarSize.height)
  #else
  return 0
  #endif
}

@MainActor
private func getSystemFontNames() -> [String] {
  #if os(iOS) || os(tvOS)
  let familyNames = UIFont.familyNames
  var fontNames = Set<String>()

  // "System Font" is added to `UIFont.familyNames` in iOS 15, and the font names that
  // correspond with it are dot prefixed .SFUI-* fonts which log the following warning
  // when passed in to `UIFont.fontNames(forFamilyName:)`:
  // > CoreText note: Client requested name “.SFUI-HeavyItalic”, it will get TimesNewRomanPSMT rather than the intended font.
  // All system UI font access should be through proper APIs such as `CTFontCreateUIFontForLanguage()` or `UIFont.systemFont(ofSize:)`.
  for familyName in familyNames where familyName != "System Font" {
    fontNames.insert(familyName)
    UIFont.fontNames(forFamilyName: familyName).forEach { fontName in
      fontNames.insert(fontName)
    }
  }
  return fontNames.sorted()
  #elseif os(macOS)
  return NSFontManager.shared.availableFontFamilies
  #endif
}

@MainActor
private func getDeviceName() -> String {
  #if os(iOS) || os(tvOS)
  return UIDevice.current.name
  #elseif os(macOS)
  return ProcessInfo.processInfo.hostName
  #endif
}

private func findEXConstantsBundle() -> Bundle? {
  let bundleName = "EXConstants.bundle"

  // Check the main app bundle first (standard CocoaPods setup)
  if let bundleUrl = Bundle.main.resourceURL?.appendingPathComponent(bundleName),
     let bundle = Bundle(url: bundleUrl) {
    return bundle
  }

  // Fall back to the bundle containing this code, which handles the case where
  // EXConstants.bundle is embedded inside a dynamic framework (e.g. expo-brownfield xcframework)
  if let bundleUrl = Bundle(for: ConstantsProvider.self).resourceURL?.appendingPathComponent(bundleName),
     let bundle = Bundle(url: bundleUrl) {
    return bundle
  }

  return nil
}

private func getManifest() -> [String: Any]? {
  guard let bundle = findEXConstantsBundle(),
        let url = bundle.url(forResource: "app", withExtension: "config") else {
    log.error("Unable to find the embedded app config")
    return nil
  }
  do {
    let configData = try Data(contentsOf: url)
    return try JSONSerialization.jsonObject(with: configData, options: []) as? [String: Any]
  } catch {
    log.error("Error reading the embedded app config: \(error)")
    return nil
  }
}
