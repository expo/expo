// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import ObjectiveC
#if os(iOS)
import UIKit
#endif

@MainActor
class SourceMapService {
  private let devMenuManager = DevMenuManager.shared
  private static let easClientIDKey = "expo.eas-client-id"

  /// Gets or creates a persistent EAS client ID (same as expo-eas-client)
  private var easClientID: String {
    if let existing = UserDefaults.standard.string(forKey: Self.easClientIDKey) {
      return existing
    }
    let newID = UUID().uuidString
    UserDefaults.standard.set(newID, forKey: Self.easClientIDKey)
    return newID
  }

  /// Checks if a URL is an EAS CDN URL (assets.eascdn.net)
  private func isEASCDNURL(_ url: URL) -> Bool {
    return url.host == "assets.eascdn.net"
  }

  /// Extracts the project ID from an EAS CDN URL
  /// URL format: https://assets.eascdn.net/{hash}?project={projectId}
  private func extractProjectID(from url: URL) -> String? {
    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
          let projectParam = components.queryItems?.first(where: { $0.name == "project" }) else {
      return nil
    }
    return projectParam.value
  }

  /// Extracts the asset key/hash from an EAS CDN URL
  /// URL format: https://assets.eascdn.net/{hash}?project={projectId}
  private func extractAssetKey(from url: URL) -> String? {
    let path = url.path
    // Remove leading slash
    return path.hasPrefix("/") ? String(path.dropFirst()) : path
  }

  /// Constructs the source map URL from the bundle URL
  /// Bundle: http://localhost:8081/index.bundle?platform=ios&dev=true
  /// SourceMap: http://localhost:8081/index.map?platform=ios&dev=true
  func getSourceMapURL() -> URL? {
    guard let bundleURL = devMenuManager.currentBridge?.bundleURL else {
      return nil
    }

    var urlString = bundleURL.absoluteString

    // Replace .bundle with .map
    if urlString.contains(".bundle") {
      urlString = urlString.replacingOccurrences(of: ".bundle", with: ".map")
    } else {
      // If no .bundle extension, insert .map before query params
      if let queryIndex = urlString.firstIndex(of: "?") {
        urlString.insert(contentsOf: ".map", at: queryIndex)
      } else {
        urlString += ".map"
      }
    }

    return URL(string: urlString)
  }

  // MARK: - EAS Manifest Fetching

  /// Fetches the EAS manifest to get asset request headers
  /// This is needed when expo-updates isn't initialized but we need to fetch from EAS CDN
  private func fetchEASManifest(projectID: String) async throws -> (launchAssetURL: String?, assetHeaders: [String: [String: Any]]?) {
    let manifestURL = URL(string: "https://u.expo.dev/\(projectID)")!
    print("[SourceMapService] Fetching manifest from: \(manifestURL)")

    var request = URLRequest(url: manifestURL)
    request.httpMethod = "GET"

    // Get SDK/runtime version
    let sdkVersion = getSDKVersion()
    let runtimeVersion = sdkVersion.map { "exposdk:\($0)" }

    // Add required headers for manifest request (matching Expo Go's format)
    request.setValue("multipart/mixed,application/expo+json,application/json", forHTTPHeaderField: "Accept")
    request.setValue("ios", forHTTPHeaderField: "Expo-Platform")
    request.setValue("ios", forHTTPHeaderField: "Exponent-Platform")
    request.setValue("1", forHTTPHeaderField: "Expo-Api-Version")
    request.setValue("1", forHTTPHeaderField: "Expo-Protocol-Version")
    request.setValue(easClientID, forHTTPHeaderField: "EAS-Client-ID")
    request.setValue("true", forHTTPHeaderField: "Expo-JSON-Error")
    request.setValue("true", forHTTPHeaderField: "Exponent-Accept-Signature")

    // Client environment (device vs simulator)
    #if targetEnvironment(simulator)
    let clientEnvironment = "EXPO_SIMULATOR"
    #else
    let clientEnvironment = "EXPO_DEVICE"
    #endif
    request.setValue(clientEnvironment, forHTTPHeaderField: "Expo-Client-Environment")
    request.setValue(clientEnvironment, forHTTPHeaderField: "Expo-Updates-Environment")

    // App version
    if let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String {
      request.setValue(appVersion, forHTTPHeaderField: "Exponent-Version")
    }

    // SDK version in Expo Go format
    if let sdkVersion = sdkVersion {
      request.setValue(sdkVersion, forHTTPHeaderField: "Exponent-SDK-Version")
      print("[SourceMapService] Using SDK version: \(sdkVersion)")
    }

    // Runtime version in exposdk: format
    if let runtimeVersion = runtimeVersion {
      request.setValue(runtimeVersion, forHTTPHeaderField: "Expo-Runtime-Version")
      print("[SourceMapService] Using runtime version: \(runtimeVersion)")
    }

    // Release channel (defaults to "default")
    request.setValue("default", forHTTPHeaderField: "Expo-Release-Channel")

    // User-Agent in Expo Go format
    request.setValue(getUserAgent(), forHTTPHeaderField: "User-Agent")

    let (data, response) = try await URLSession.shared.data(for: request)

    guard let httpResponse = response as? HTTPURLResponse else {
      throw SourceMapError.networkError(NSError(domain: "SourceMapService", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid response"]))
    }

    print("[SourceMapService] Manifest response status: \(httpResponse.statusCode)")
    print("[SourceMapService] Manifest request headers: \(request.allHTTPHeaderFields ?? [:])")

    if !(200...299).contains(httpResponse.statusCode) {
      // Log the error response body for debugging
      if let errorBody = String(data: data, encoding: .utf8) {
        print("[SourceMapService] Manifest error response: \(errorBody)")
      }
      throw SourceMapError.httpError(httpResponse.statusCode)
    }

    // Parse the manifest - could be JSON or multipart
    let contentType = httpResponse.value(forHTTPHeaderField: "Content-Type") ?? ""

    if contentType.contains("multipart") {
      return try parseMultipartManifest(data: data, contentType: contentType)
    } else {
      return try parseJSONManifest(data: data)
    }
  }

  /// Constructs a User-Agent string matching Expo Go's format
  private func getUserAgent() -> String {
    #if os(iOS)
    var systemInfo = utsname()
    uname(&systemInfo)
    let deviceModel = withUnsafePointer(to: &systemInfo.machine) {
      $0.withMemoryRebound(to: CChar.self, capacity: 1) {
        String(cString: $0)
      }
    }
    let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
    let osVersion = ProcessInfo.processInfo.operatingSystemVersionString
    let scale = UIScreen.main.scale
    let locale = Locale.current.identifier
    return "Exponent/\(appVersion) (\(deviceModel); iOS \(osVersion); Scale/\(String(format: "%.2f", scale)); \(locale))"
    #else
    return "Exponent/unknown"
    #endif
  }

  /// Gets the SDK version from Expo.plist, Info.plist, or EXVersions
  private func getSDKVersion() -> String? {
    // Try to get from EXVersions.sharedInstance.sdkVersion via reflection (Expo Go)
    if let versionsClass = NSClassFromString("EXVersions") {
      let sharedInstanceSelector = NSSelectorFromString("sharedInstance")
      if let metaClass = object_getClass(versionsClass),
         class_respondsToSelector(metaClass, sharedInstanceSelector),
         let instance = (versionsClass as AnyObject).perform(sharedInstanceSelector)?.takeUnretainedValue() {
        if let sdkVersion = (instance as AnyObject).value(forKey: "sdkVersion") as? String {
          print("[SourceMapService] Got SDK version from EXVersions: \(sdkVersion)")
          return sdkVersion
        }
      }
    }

    // Try EXUpdatesRuntimeVersion from Expo.plist (might be in exposdk: format)
    if let expoPlistPath = Bundle.main.path(forResource: "Expo", ofType: "plist"),
       let expoPlist = NSDictionary(contentsOfFile: expoPlistPath),
       let runtimeVersion = expoPlist["EXUpdatesRuntimeVersion"] as? String {
      // Strip exposdk: prefix if present
      if runtimeVersion.hasPrefix("exposdk:") {
        return String(runtimeVersion.dropFirst(8))
      }
      return runtimeVersion
    }

    // Fall back to Info.plist
    if let runtimeVersion = Bundle.main.infoDictionary?["EXUpdatesRuntimeVersion"] as? String {
      if runtimeVersion.hasPrefix("exposdk:") {
        return String(runtimeVersion.dropFirst(8))
      }
      return runtimeVersion
    }

    // Try to construct from app version as last resort
    if let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String {
      return version
    }

    return nil
  }

  /// Parses a multipart manifest response
  private func parseMultipartManifest(data: Data, contentType: String) throws -> (launchAssetURL: String?, assetHeaders: [String: [String: Any]]?) {
    // Extract boundary from content type
    guard let boundaryRange = contentType.range(of: "boundary="),
          let boundary = contentType[boundaryRange.upperBound...].split(separator: ";").first else {
      print("[SourceMapService] Could not extract boundary from multipart response")
      return (nil, nil)
    }

    let boundaryString = String(boundary).trimmingCharacters(in: .whitespaces).replacingOccurrences(of: "\"", with: "")

    // Simple multipart parsing - look for the manifest part
    guard let dataString = String(data: data, encoding: .utf8) else {
      return (nil, nil)
    }

    let parts = dataString.components(separatedBy: "--\(boundaryString)")

    for part in parts {
      // Look for the manifest part (Content-Disposition: form-data; name="manifest")
      if part.contains("name=\"manifest\"") || part.contains("application/json") || part.contains("application/expo+json") {
        // Find the JSON content (after the headers)
        if let jsonStart = part.range(of: "\r\n\r\n") ?? part.range(of: "\n\n") {
          let jsonContent = String(part[jsonStart.upperBound...]).trimmingCharacters(in: .whitespacesAndNewlines)
          if let jsonData = jsonContent.data(using: .utf8) {
            return try parseJSONManifest(data: jsonData)
          }
        }
      }
    }

    return (nil, nil)
  }

  /// Parses a JSON manifest response
  private func parseJSONManifest(data: Data) throws -> (launchAssetURL: String?, assetHeaders: [String: [String: Any]]?) {
    guard let manifest = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
      print("[SourceMapService] Failed to parse manifest JSON")
      return (nil, nil)
    }

    print("[SourceMapService] Parsed manifest with keys: \(manifest.keys)")

    // Get launch asset URL
    var launchAssetURL: String?
    if let launchAsset = manifest["launchAsset"] as? [String: Any],
       let url = launchAsset["url"] as? String {
      launchAssetURL = url
    }

    // Get asset request headers
    let assetHeaders = manifest["assetRequestHeaders"] as? [String: [String: Any]]

    print("[SourceMapService] Launch asset URL from manifest: \(String(describing: launchAssetURL))")
    print("[SourceMapService] Asset headers keys: \(String(describing: assetHeaders?.keys))")

    return (launchAssetURL, assetHeaders)
  }

  // MARK: - Expo Go Integration via EXKernel

  /// Gets the local bundle path from Expo Go's EXKernel
  /// Path: EXKernel.sharedInstance.visibleApp.appLoader.appLauncher.launchAssetUrl
  private func getLaunchAssetURLFromExpoGoKernel() -> URL? {
    // Get EXKernel.sharedInstance
    guard let kernelClass = NSClassFromString("EXKernel") else {
      print("[SourceMapService] EXKernel class not found - not running in Expo Go")
      return nil
    }

    let sharedInstanceSelector = NSSelectorFromString("sharedInstance")
    guard let metaClass = object_getClass(kernelClass),
          class_respondsToSelector(metaClass, sharedInstanceSelector),
          let kernel = (kernelClass as AnyObject).perform(sharedInstanceSelector)?.takeUnretainedValue() else {
      print("[SourceMapService] Could not get EXKernel.sharedInstance")
      return nil
    }

    // Get visibleApp
    guard let visibleApp = (kernel as AnyObject).value(forKey: "visibleApp") else {
      print("[SourceMapService] EXKernel.visibleApp is nil")
      return nil
    }

    // Get appLoader
    guard let appLoader = (visibleApp as AnyObject).value(forKey: "appLoader") else {
      print("[SourceMapService] visibleApp.appLoader is nil")
      return nil
    }

    print("[SourceMapService] Got appLoader of type: \(type(of: appLoader))")

    // Get appLauncher from the loader (for EXAppLoaderExpoUpdates)
    if let appLauncher = (appLoader as AnyObject).value(forKey: "appLauncher") {
      print("[SourceMapService] Got appLauncher of type: \(type(of: appLauncher))")

      // Get launchAssetUrl from the launcher
      let launchAssetUrlSelector = NSSelectorFromString("launchAssetUrl")
      if (appLauncher as AnyObject).responds(to: launchAssetUrlSelector),
         let url = (appLauncher as AnyObject).perform(launchAssetUrlSelector)?.takeUnretainedValue() as? URL {
        print("[SourceMapService] Got launchAssetUrl from Expo Go kernel: \(url)")
        return url
      }
    }

    print("[SourceMapService] Could not get launchAssetUrl from Expo Go kernel")
    return nil
  }

  // MARK: - expo-updates Integration via EXUpdatesInterface

  /// Gets the local file URL where expo-updates downloaded the bundle
  /// This is the preferred way to access the bundle as it's already downloaded
  private func getLaunchAssetURLFromUpdatesController() -> URL? {
    // Get UpdatesControllerRegistry.sharedInstance.controller.launchAssetURL via reflection
    guard let registryClass = NSClassFromString("EXUpdatesControllerRegistry") else {
      print("[SourceMapService] EXUpdatesControllerRegistry class not found - expo-updates may not be installed")
      return nil
    }

    let sharedInstanceSelector = NSSelectorFromString("sharedInstance")
    guard let metaClass = object_getClass(registryClass),
          class_respondsToSelector(metaClass, sharedInstanceSelector),
          let registry = (registryClass as AnyObject).perform(sharedInstanceSelector)?.takeUnretainedValue() else {
      print("[SourceMapService] Could not get UpdatesControllerRegistry.sharedInstance")
      return nil
    }

    // Get the controller property
    guard let controller = (registry as AnyObject).value(forKey: "controller") else {
      print("[SourceMapService] UpdatesControllerRegistry.controller is nil")
      return nil
    }

    // Get launchAssetURL from the controller
    if let launchAssetURL = (controller as AnyObject).value(forKey: "launchAssetURL") as? URL {
      print("[SourceMapService] Got launchAssetURL from UpdatesControllerRegistry: \(launchAssetURL)")
      return launchAssetURL
    }

    print("[SourceMapService] launchAssetURL is nil")
    return nil
  }

  /// Gets the launch asset's extraRequestHeaders from expo-updates
  /// Accesses the internal AppController to get asset headers needed for EAS CDN auth
  private func getLaunchAssetExtraHeaders() -> [String: Any]? {
    // Try to get the internal AppController which has more methods
    guard let appController = getInternalAppController() else {
      print("[SourceMapService] Could not get internal AppController")
      return nil
    }

    // Try to get launcher
    if let launcher = getLauncher(from: appController) {
      let headers = getExtraHeadersFromLauncher(launcher)
      print("[SourceMapService] Got extra headers from launcher: \(String(describing: headers))")
      return headers
    }

    print("[SourceMapService] Could not get launcher from controller")
    return nil
  }

  /// Gets the internal AppController (not the interface, the actual implementation)
  private func getInternalAppController() -> AnyObject? {
    // The actual AppController class in expo-updates
    // The @objc(EXUpdatesAppController) attribute sets the Objective-C name
    guard let appControllerClass = NSClassFromString("EXUpdatesAppController") else {
      print("[SourceMapService] EXUpdatesAppController class not found - expo-updates may not be installed")
      return nil
    }

    // Check if it's initialized using isInitialized class method
    let isInitializedSelector = NSSelectorFromString("isInitialized")
    if let metaClass = object_getClass(appControllerClass),
       class_respondsToSelector(metaClass, isInitializedSelector) {
      // Call isInitialized() class method - it returns Bool
      typealias IsInitializedMethod = @convention(c) (AnyClass, Selector) -> Bool
      let methodIMP = class_getMethodImplementation(metaClass, isInitializedSelector)
      let isInitialized = unsafeBitCast(methodIMP, to: IsInitializedMethod.self)(appControllerClass, isInitializedSelector)

      if !isInitialized {
        print("[SourceMapService] AppController is not initialized")
        return nil
      }
    }

    let sharedInstanceSelector = NSSelectorFromString("sharedInstance")
    guard let metaClass = object_getClass(appControllerClass),
          class_respondsToSelector(metaClass, sharedInstanceSelector),
          let sharedInstance = (appControllerClass as AnyObject).perform(sharedInstanceSelector)?.takeUnretainedValue() else {
      print("[SourceMapService] Could not get sharedInstance from EXUpdatesAppController")
      return nil
    }

    print("[SourceMapService] Successfully got AppController instance of type: \(type(of: sharedInstance))")

    // The sharedInstance returns an InternalAppControllerInterface, which could be:
    // - EnabledAppController
    // - DisabledAppController
    // - DevLauncherAppController
    //
    // All of these have a launchAssetUrl() method that returns the local file URL

    return sharedInstance as AnyObject
  }

  /// Gets the launch asset URL directly from AppController via launchAssetUrl() method
  private func getLaunchAssetURLFromAppController() -> URL? {
    guard let controller = getInternalAppController() else { return nil }

    // Try calling launchAssetUrl() method - all controller implementations have this
    let selector = NSSelectorFromString("launchAssetUrl")
    if (controller as AnyObject).responds(to: selector),
       let result = (controller as AnyObject).perform(selector)?.takeUnretainedValue() as? URL {
      print("[SourceMapService] Got launchAssetUrl from AppController: \(result)")
      return result
    }

    print("[SourceMapService] launchAssetUrl() returned nil or not available")
    return nil
  }

  private func getLauncher(from controller: AnyObject) -> AnyObject? {
    let controllerType = type(of: controller)
    print("[SourceMapService] Controller type: \(controllerType)")

    // Try to get launcher via startupProcedure (EnabledAppController path)
    do {
      if let startupProcedure = try (controller as AnyObject).value(forKey: "startupProcedure") {
        print("[SourceMapService] Found startupProcedure")
        if let launcher = try (startupProcedure as AnyObject).value(forKey: "launcher") {
          print("[SourceMapService] Found launcher via startupProcedure")
          return launcher as AnyObject
        }
      }
    } catch {
      print("[SourceMapService] startupProcedure path failed: \(error)")
    }

    // Try direct launcher property (DevLauncherAppController path)
    // Note: DevLauncherAppController stores launcher as a private property
    do {
      if let launcher = try (controller as AnyObject).value(forKey: "launcher") {
        print("[SourceMapService] Found launcher directly on controller")
        return launcher as AnyObject
      }
    } catch {
      print("[SourceMapService] Direct launcher path failed: \(error)")
    }

    // For DevLauncherAppController, we can try to get constants which has launchedUpdate
    let getConstantsSelector = NSSelectorFromString("getConstantsForModule")
    if (controller as AnyObject).responds(to: getConstantsSelector) {
      print("[SourceMapService] Controller responds to getConstantsForModule")
    }

    return nil
  }

  private func getExtraHeadersFromLauncher(_ launcher: AnyObject) -> [String: Any]? {
    // Get launchedUpdate from launcher
    guard let launchedUpdate = (launcher as AnyObject).value(forKey: "launchedUpdate") else {
      return nil
    }

    // Get assets from the update - this is a method, not a property
    let assetsSelector = NSSelectorFromString("assets")
    guard (launchedUpdate as AnyObject).responds(to: assetsSelector),
          let assets = (launchedUpdate as AnyObject).perform(assetsSelector)?.takeUnretainedValue() as? [AnyObject] else {
      return nil
    }

    // Find the launch asset and get its headers
    for asset in assets {
      if let isLaunch = (asset as AnyObject).value(forKey: "isLaunchAsset") as? Bool, isLaunch {
        if let headers = (asset as AnyObject).value(forKey: "extraRequestHeaders") as? [String: Any] {
          return headers
        }
      }
    }

    return nil
  }

  // MARK: - Source Map Fetching

  /// Fetches and parses the source map, trying multiple strategies
  func fetchSourceMap() async throws -> SourceMap {
    let bundleURL = devMenuManager.currentBridge?.bundleURL
    print("[SourceMapService] Bridge bundleURL: \(String(describing: bundleURL))")

    // Strategy 1: If the bundle is from Metro dev server, try to fetch external .map file
    if let bundleURL = bundleURL,
       !bundleURL.isFileURL,
       !isEASCDNURL(bundleURL),
       let externalSourceMap = try? await fetchExternalSourceMap() {
      print("[SourceMapService] Successfully fetched external source map from Metro")
      return externalSourceMap
    }

    // Strategy 2: Check if expo-updates or Expo Go has downloaded the bundle locally
    // This is the preferred path for EAS Updates - the bundle is already on disk
    // Try Expo Go kernel first, then UpdatesControllerRegistry, then AppController
    let localBundleURL = getLaunchAssetURLFromExpoGoKernel()
                      ?? getLaunchAssetURLFromUpdatesController()
                      ?? getLaunchAssetURLFromAppController()
    if let localBundleURL = localBundleURL, localBundleURL.isFileURL {
      print("[SourceMapService] Using local bundle from expo-updates: \(localBundleURL)")
      return try extractInlineSourceMapFromLocalFile(localBundleURL)
    }

    // Strategy 3: Check if bridge's bundle URL is a local file
    if let bundleURL = bundleURL, bundleURL.isFileURL {
      print("[SourceMapService] Using local bundle from bridge: \(bundleURL)")
      return try extractInlineSourceMapFromLocalFile(bundleURL)
    }

    // Strategy 4: Fetch from remote URL with proper auth headers (EAS CDN)
    // This is a fallback - ideally expo-updates should have downloaded it already
    if let bundleURL = bundleURL {
      print("[SourceMapService] Fetching bundle from remote URL: \(bundleURL)")
      return try await fetchInlineSourceMapFromRemote(bundleURL)
    }

    throw SourceMapError.noSourceMapFound
  }

  /// Attempts to fetch an external .map file (used in dev mode)
  private func fetchExternalSourceMap() async throws -> SourceMap {
    guard let sourceMapURL = getSourceMapURL() else {
      throw SourceMapError.invalidSourceMapURL
    }

    let (data, response) = try await URLSession.shared.data(from: sourceMapURL)

    if let httpResponse = response as? HTTPURLResponse,
       !(200...299).contains(httpResponse.statusCode) {
      throw SourceMapError.httpError(httpResponse.statusCode)
    }

    return try JSONDecoder().decode(SourceMap.self, from: data)
  }

  /// Reads a local bundle file and extracts inline source map
  private func extractInlineSourceMapFromLocalFile(_ fileURL: URL) throws -> SourceMap {
    let data = try Data(contentsOf: fileURL)

    guard let bundleContent = String(data: data, encoding: .utf8) else {
      throw SourceMapError.noSourceMapFound
    }

    return try extractInlineSourceMap(from: bundleContent)
  }

  /// Fetches a remote bundle with proper Expo/EAS headers and extracts inline source map
  private func fetchInlineSourceMapFromRemote(_ bundleURL: URL) async throws -> SourceMap {
    // First try with headers from expo-updates
    var extraHeaders = getLaunchAssetExtraHeaders()

    // If no headers from expo-updates and this is an EAS CDN URL, try fetching the manifest
    if extraHeaders == nil && isEASCDNURL(bundleURL) {
      print("[SourceMapService] No expo-updates headers available, trying to fetch manifest...")

      if let projectID = extractProjectID(from: bundleURL) {
        do {
          let (manifestLaunchURL, manifestHeaders) = try await fetchEASManifest(projectID: projectID)

          // Get the asset key from our bundle URL to look up headers
          if let assetKey = extractAssetKey(from: bundleURL),
             let headers = manifestHeaders?[assetKey] {
            extraHeaders = headers
            print("[SourceMapService] Got headers for asset key '\(assetKey)' from manifest")
          } else if let launchAssetKey = manifestLaunchURL.flatMap({ URL(string: $0) }).flatMap({ extractAssetKey(from: $0) }),
                    let headers = manifestHeaders?[launchAssetKey] {
            // Try using the launch asset's headers
            extraHeaders = headers
            print("[SourceMapService] Got headers for launch asset from manifest")
          }

          // If manifest gives us a different URL for the launch asset, use that
          if let manifestLaunchURL = manifestLaunchURL,
             let newURL = URL(string: manifestLaunchURL),
             newURL != bundleURL {
            print("[SourceMapService] Manifest provided different launch asset URL: \(newURL)")
            // Recursively try with the new URL
            return try await fetchInlineSourceMapFromRemote(newURL)
          }
        } catch {
          print("[SourceMapService] Failed to fetch manifest: \(error)")
          // Continue without manifest headers
        }
      }
    }

    var request = URLRequest(url: bundleURL)

    // Add standard Expo headers
    request.setValue("ios", forHTTPHeaderField: "Expo-Platform")
    request.setValue("1", forHTTPHeaderField: "Expo-Protocol-Version")
    request.setValue("1", forHTTPHeaderField: "Expo-API-Version")
    request.setValue("BARE", forHTTPHeaderField: "Expo-Updates-Environment")
    request.setValue(easClientID, forHTTPHeaderField: "EAS-Client-ID")

    // Add asset-specific headers
    if let extraHeaders = extraHeaders {
      print("[SourceMapService] Adding \(extraHeaders.count) extra headers")
      for (key, value) in extraHeaders {
        if let stringValue = value as? String {
          request.setValue(stringValue, forHTTPHeaderField: key)
        } else if let boolValue = value as? Bool {
          request.setValue(boolValue ? "true" : "false", forHTTPHeaderField: key)
        } else if let numberValue = value as? NSNumber {
          request.setValue(numberValue.stringValue, forHTTPHeaderField: key)
        }
      }
    } else {
      print("[SourceMapService] No extra headers available")
    }

    print("[SourceMapService] Fetching remote bundle with headers: \(request.allHTTPHeaderFields ?? [:])")

    let (data, response) = try await URLSession.shared.data(for: request)

    if let httpResponse = response as? HTTPURLResponse {
      print("[SourceMapService] Remote fetch response: \(httpResponse.statusCode)")
      if !(200...299).contains(httpResponse.statusCode) {
        if httpResponse.statusCode == 403 && isEASCDNURL(bundleURL) {
          throw SourceMapError.easCDNAuthFailed
        }
        throw SourceMapError.httpError(httpResponse.statusCode)
      }
    }

    guard let bundleContent = String(data: data, encoding: .utf8) else {
      throw SourceMapError.noSourceMapFound
    }

    print("[SourceMapService] Fetched bundle content length: \(bundleContent.count) characters")
    return try extractInlineSourceMap(from: bundleContent)
  }

  /// Extracts and decodes an inline source map from bundle content
  /// Looks for: //# sourceMappingURL=data:application/json;charset=utf-8;base64,<base64data>
  /// Or: //# sourceMappingURL=data:application/json;base64,<base64data>
  private func extractInlineSourceMap(from bundleContent: String) throws -> SourceMap {
    // Pattern for inline source maps
    let patterns = [
      "//# sourceMappingURL=data:application/json;charset=utf-8;base64,",
      "//# sourceMappingURL=data:application/json;base64,",
      "//@ sourceMappingURL=data:application/json;charset=utf-8;base64,",
      "//@ sourceMappingURL=data:application/json;base64,"
    ]

    for pattern in patterns {
      if let range = bundleContent.range(of: pattern) {
        let base64Start = range.upperBound
        // Find the end of the base64 data (newline or end of string)
        let endIndex = bundleContent[base64Start...].firstIndex(where: { $0.isNewline }) ?? bundleContent.endIndex
        let base64String = String(bundleContent[base64Start..<endIndex])

        guard let decodedData = Data(base64Encoded: base64String) else {
          throw SourceMapError.invalidInlineSourceMap
        }

        do {
          return try JSONDecoder().decode(SourceMap.self, from: decodedData)
        } catch {
          throw SourceMapError.parseError(error)
        }
      }
    }

    throw SourceMapError.noSourceMapFound
  }

  /// Builds a file tree from the source map sources array
  func buildFileTree(from sourceMap: SourceMap) -> [FileTreeNode] {
    var rootChildren: [String: FileTreeNode] = [:]

    for (index, sourcePath) in sourceMap.sources.enumerated() {
      insertPath(sourcePath, contentIndex: index, into: &rootChildren)
    }

    let sorted = sortNodes(Array(rootChildren.values))
    return collapseSingleChildFolders(sorted)
  }

  /// Collapses folder chains that have only a single child folder
  /// e.g., Users/evanbacon/Documents/GitHub becomes one expandable node
  private func collapseSingleChildFolders(_ nodes: [FileTreeNode]) -> [FileTreeNode] {
    return nodes.map { node in
      var current = node

      // Keep collapsing while we have a directory with exactly one child that's also a directory
      while current.isDirectory && current.children.count == 1 && current.children[0].isDirectory {
        let child = current.children[0]
        current = FileTreeNode(
          name: "\(current.name)/\(child.name)",
          path: child.path,
          isDirectory: true,
          children: child.children,
          contentIndex: nil
        )
      }

      // Recursively collapse children
      if current.isDirectory && !current.children.isEmpty {
        var collapsed = current
        collapsed.children = collapseSingleChildFolders(current.children)
        return collapsed
      }

      return current
    }
  }

  private func insertPath(_ path: String, contentIndex: Int, into nodes: inout [String: FileTreeNode]) {
    let components = path.split(separator: "/").map(String.init)
    guard !components.isEmpty else { return }

    let firstName = components[0]

    if components.count == 1 {
      // This is a file at this level
      nodes[firstName] = FileTreeNode(
        name: firstName,
        path: path,
        isDirectory: false,
        contentIndex: contentIndex
      )
    } else {
      // This is a directory
      var existingNode = nodes[firstName] ?? FileTreeNode(
        name: firstName,
        path: firstName,
        isDirectory: true
      )

      let remainingPath = components.dropFirst().joined(separator: "/")
      var childrenDict = Dictionary(uniqueKeysWithValues: existingNode.children.map { ($0.name, $0) })
      insertPath(remainingPath, contentIndex: contentIndex, into: &childrenDict)
      existingNode.children = Array(childrenDict.values)

      nodes[firstName] = existingNode
    }
  }

  private func sortNodes(_ nodes: [FileTreeNode]) -> [FileTreeNode] {
    var sorted = nodes.sorted { node1, node2 in
      if node1.isDirectory != node2.isDirectory {
        return node1.isDirectory
      }
      return node1.name.localizedCaseInsensitiveCompare(node2.name) == .orderedAscending
    }

    for i in sorted.indices {
      sorted[i].children = sortNodes(sorted[i].children)
    }

    return sorted
  }
}
