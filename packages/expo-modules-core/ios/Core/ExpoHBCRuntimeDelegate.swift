// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation

/**
 * A runtime delegate that handles Hermes Bytecode (HBC) injection before the main bundle loads.
 * This delegate searches for `bundle.hbc` files in Expo module bundles and injects them into the
 * JavaScript runtime during initialization.
 */
@objc(EXHBCRuntimeDelegate)
public class ExpoHBCRuntimeDelegate: NSObject {
  
  /**
   * The app context that this delegate is associated with.
   */
  private weak var appContext: AppContext?
  
  /**
   * Initializes the HBC runtime delegate with the given app context.
   */
  @objc
  public init(appContext: AppContext) {
    self.appContext = appContext
    super.init()
  }
  
  /**
   * Factory method for creating HBC runtime delegate from Objective-C.
   */
  @objc
  public static func create(withAppContext appContext: AppContext) -> ExpoHBCRuntimeDelegate {
    return ExpoHBCRuntimeDelegate(appContext: appContext)
  }
  
  /**
   * Called when the runtime is initialized. This is where we inject HBC files.
   */
  @objc
  public func didInitializeRuntime() {
    guard let appContext = appContext,
          let runtime = appContext._runtime else {
      NSLog("ExpoHBCRuntimeDelegate: App context or runtime is nil, skipping HBC injection")
      return
    }
    
    do {
      try injectHBCFiles(runtime: runtime, appContext: appContext)
    } catch {
      NSLog("ExpoHBCRuntimeDelegate: Failed to inject HBC files: \(error)")
    }
  }
  
  /**
   * Discovers and injects HBC files from Expo module bundles.
   */
  private func injectHBCFiles(runtime: ExpoRuntime, appContext: AppContext) throws {
    // First, inject debug marker to verify the system is working
    injectDebugMarker(runtime: runtime)
    
    let hbcFiles = discoverHBCFiles()
    
    guard !hbcFiles.isEmpty else {
      NSLog("ExpoHBCRuntimeDelegate: No HBC files found")
      return
    }
    
    NSLog("ExpoHBCRuntimeDelegate: Found \(hbcFiles.count) HBC file(s) to inject")
    
    for hbcFile in hbcFiles {
      try injectHBCFile(at: hbcFile, runtime: runtime)
    }
  }
  
  /**
   * Injects a debug marker to verify the injection system is working.
   */
  private func injectDebugMarker(runtime: ExpoRuntime) {
    NSLog("ExpoHBCRuntimeDelegate: Injecting debug marker")
    
    let debugScript = """
      // Expo HBC Injection Debug Marker
      globalThis.EXPO_HBC_INJECTED = true;
      globalThis.EXPO_HBC_INJECTION_TIME = Date.now();
      console.log('Expo HBC injection system is working! Time:', globalThis.EXPO_HBC_INJECTION_TIME);
      """
    
    let debugData = debugScript.data(using: .utf8)!
    _ = EXHBCRuntimeManager.injectHermesBytecode(debugData, runtime: runtime)
    
    NSLog("ExpoHBCRuntimeDelegate: Debug marker injected successfully")
  }
  
  /**
   * Discovers HBC files in the application bundle and registered module bundles.
   */
  private func discoverHBCFiles() -> [URL] {
    var hbcFiles: [URL] = []
    
    // Search in main bundle
    if let mainBundleHBC = Bundle.main.url(forResource: "bundle", withExtension: "hbc") {
      hbcFiles.append(mainBundleHBC)
    }
    
    let coreBundle = Bundle(for: ExpoHBCRuntimeDelegate.self)
    // Search in ExpoModulesCore bundle
    if let coreBundleHBC = coreBundle.url(forResource: "bundle", withExtension: "hbc") {
      hbcFiles.append(coreBundleHBC)
    }
    
    // Search in any additional bundles that might contain HBC files
    if let bundlePath = Bundle.main.path(forResource: "ExpoModulesCore", ofType: "bundle"),
       let expoBundle = Bundle(path: bundlePath),
       let expoBundleHBC = expoBundle.url(forResource: "bundle", withExtension: "hbc") {
      hbcFiles.append(expoBundleHBC)
    }
    
    return hbcFiles
  }
  
  /**
   * Injects a single HBC file into the JavaScript runtime.
   */
  private func injectHBCFile(at url: URL, runtime: ExpoRuntime) throws {
    guard FileManager.default.fileExists(atPath: url.path) else {
      throw ExpoHBCError.fileNotFound(url.path)
    }
    
    let data = try Data(contentsOf: url)
    
    NSLog("ExpoHBCRuntimeDelegate: Injecting HBC file: \(url.lastPathComponent) (\(data.count) bytes)")
    
    // Use the Expo runtime's bridge to inject bytecode
    _ = EXHBCRuntimeManager.injectHermesBytecode(data, runtime: runtime)
    
    NSLog("ExpoHBCRuntimeDelegate: Successfully injected HBC file: \(url.lastPathComponent)")
  }
}

/**
 * Errors that can occur during HBC injection.
 */
enum ExpoHBCError: LocalizedError {
  case fileNotFound(String)
  case injectionFailed(String)
  
  var errorDescription: String? {
    switch self {
    case .fileNotFound(let path):
      return "HBC file not found at path: \(path)"
    case .injectionFailed(let reason):
      return "HBC injection failed: \(reason)"
    }
  }
}
