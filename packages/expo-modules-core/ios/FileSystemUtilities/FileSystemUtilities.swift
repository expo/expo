import Foundation

public enum FileSystemPermissionFlags {
  case none
  case read
  case write
}

public struct FileSystemUtilities {
  @discardableResult
  public static func ensureDirExists(at url: URL?) -> Bool {
    guard let url else {
      return false
    }
    let exists = FileManager.default.fileExists(atPath: url.path)

    if !exists {
      do {
        try FileManager.default.createDirectory(atPath: url.path, withIntermediateDirectories: true)
      } catch {
        return false
      }
    }

    return true
  }

  public static func generatePathInCache(_ appContext: AppContext?, in directory: String, extension: String) -> String {
    guard let appContext, let dirPath = appContext.config.cacheDirectory?.appendingPathComponent(directory) else {
      return ""
    }
    let fileName = UUID().uuidString.appending(`extension`)
    ensureDirExists(at: dirPath)
    return dirPath.appendingPathComponent(fileName).path
  }

  public static func permissions(_ appContext: AppContext?, for uri: URL) -> [FileSystemPermissionFlags] {
    guard let scheme = uri.scheme else {
      return [.none]
    }
    let validSchemas = ["assets-library", "http", "https", "ph"]

    if validSchemas.contains(scheme) {
      return [.read]
    }

    if scheme == "file" {
      return getPathPermissions(appContext, for: uri)
    }

    return [.none]
  }

  private static func getPathPermissions(_ appContext: AppContext?, for path: URL) -> [FileSystemPermissionFlags] {
    let permissionForInternalDirs = getInternalPathPermissions(appContext, for: path)
    if !permissionForInternalDirs.contains(.none) {
      return permissionForInternalDirs
    }
    return getExternalPathPermissions(path, appContext)
  }

  public static func getInternalPathPermissions(_ appContext: AppContext?, for url: URL) -> [FileSystemPermissionFlags] {
    guard let appContext else {
      return [.none]
    }

    let scopedDirs = [appContext.config.cacheDirectory, appContext.config.documentDirectory] + appContext.config.appGroupSharedDirectories
    let standardizedPath = url.standardized.path

    for dir in scopedDirs {
      guard let dir else {
        continue
      }
      if standardizedPath.hasPrefix(dir.appendingPathComponent("/").path) || standardizedPath == dir.path {
        return [.read, .write]
      }
    }

    let bundleDirectory = Bundle.main.bundlePath
    if url.path.hasPrefix(bundleDirectory + "/") {
      return [.read]
    }

    return [.none]
  }

  private static func getExternalPathPermissions(_ url: URL, _ appContext: AppContext?) -> [FileSystemPermissionFlags] {
    if appContext?.config.scoped ?? false && url.path.contains("ExponentExperienceData") {
      return []
    }

    // Defer permission checks for external paths to the underlying system at the time of file operations
    return [.read, .write]
  }

  private static func getAppGroupSharedDirectories(_ appContext: AppContext) -> [String] {
    let appGroups = appContext.appCodeSignEntitlements.appGroups ?? []
    var appGroupSharedDirectories: [String] = []
    for appGroup in appGroups {
      if let directory = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroup) {
        appGroupSharedDirectories.append(directory.standardized.path)
      }
    }
    return appGroups
  }
}
