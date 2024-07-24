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
    return getExternalPathPermissions(path)
  }

  private static func getInternalPathPermissions(_ appContext: AppContext?, for url: URL) -> [FileSystemPermissionFlags] {
    guard let appContext else {
      return [.none]
    }

    let scopedDirs = [appContext.config.cacheDirectory, appContext.config.documentDirectory]
    let standardizedPath = url.standardized.path

    for dir in scopedDirs {
      guard let dir else {
        continue
      }
      if standardizedPath.hasPrefix(dir.appendingPathComponent("/").absoluteString) || standardizedPath == dir.absoluteString {
        return [.read, .write]
      }
    }

    let bundleDirectory = Bundle.main.bundlePath
    if url.path.hasPrefix(bundleDirectory + "/") {
      return [.read]
    }

    return [.none]
  }

  private static func getExternalPathPermissions(_ url: URL) -> [FileSystemPermissionFlags] {
    var filePermissions: [FileSystemPermissionFlags] = []

    if FileManager.default.isReadableFile(atPath: url.path) {
      filePermissions.append(.read)
    }

    if FileManager.default.isWritableFile(atPath: url.path) {
      filePermissions.append(.write)
    }

    return filePermissions
  }
}
