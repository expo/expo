// Copyright 2023-present 650 Industries. All rights reserved.

import Foundation

@objc(EXFileSystemLegacyUtilities)
public class FileSystemLegacyUtilities: NSObject, EXInternalModule, EXFileSystemInterface, EXFilePermissionModuleInterface {
  @objc
  public var documentDirectory: String

  @objc
  public var cachesDirectory: String

  var isScoped: Bool = false

  @objc
  public init(documentDirectory: String, cachesDirectory: String) {
    self.documentDirectory = documentDirectory
    self.cachesDirectory = cachesDirectory
    self.isScoped = true
  }

  required public override init() {
    let documentPaths = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)
    self.documentDirectory = documentPaths[0]

    let cachesPaths = NSSearchPathForDirectoriesInDomains(.cachesDirectory, .userDomainMask, true)
    self.cachesDirectory = cachesPaths[0]
  }

  public static func exportedInterfaces() -> [Protocol] {
    return [EXFileSystemInterface.self, EXFilePermissionModuleInterface.self]
  }

  @objc
  public func permissions(forURI uri: URL) -> EXFileSystemPermissionFlags {
    let validSchemas = [
      "assets-library",
      "http",
      "https",
      "ph"
    ]

    if validSchemas.contains(uri.scheme ?? "") {
      return EXFileSystemPermissionFlags.read
    }
    if uri.scheme == "file" {
      return getPathPermissions(uri.absoluteString)
    }
    return []
  }

  @objc
  public func generatePath(inDirectory directory: String, withExtension ext: String) -> String {
    let fileName = "\(UUID().uuidString)\(ext)"
    ensureDirExists(withPath: directory)
    return (directory as NSString).appendingPathComponent(fileName)
  }

  @objc
  public func ensureDirExists(withPath path: String) -> Bool {
    let url = URL(fileURLWithPath: path)
    return FileSystemUtilities.ensureDirExists(at: url)
  }

  @objc
  public func getPathPermissions(_ path: String) -> EXFileSystemPermissionFlags {
    guard let url = URL(string: path) else {
      return []
    }
    let permissionsForInternalDirectories = getInternalPathPermissions(url)
    if !permissionsForInternalDirectories.isEmpty {
      return permissionsForInternalDirectories
    }
    return getExternalPathPermissions(url)
  }

  @objc
  public func getInternalPathPermissions(_ path: URL) -> EXFileSystemPermissionFlags {
    let scopedDirs: [String] = [cachesDirectory, documentDirectory]
    let standardizedPath = path.standardized.path
    for scopedDirectory in scopedDirs {
      if standardizedPath.hasPrefix(scopedDirectory + "/") || standardizedPath == scopedDirectory {
        return [.read, .write]
      }
    }
    return []
  }

  @objc
  public func getExternalPathPermissions(_ path: URL) -> EXFileSystemPermissionFlags {
    if self.isScoped && path.path.contains("ExponentExperienceData") {
      return []
    }
    var filePermissions: EXFileSystemPermissionFlags = []
    if FileManager.default.isReadableFile(atPath: path.absoluteString) {
      filePermissions.insert(.read)
    }
    if FileManager.default.isWritableFile(atPath: path.absoluteString) {
      filePermissions.insert(.write)
    }
    return filePermissions
  }
}
