// Copyright 2023-present 650 Industries. All rights reserved.

import Foundation

@objc(EXFileSystemLegacyUtilities)
public class FileSystemLegacyUtilities: NSObject, EXInternalModule, EXFileSystemInterface, EXFilePermissionModuleInterface {
  @objc
  public var documentDirectory: String

  @objc
  public var cachesDirectory: String

  @objc
  public var applicationSupportDirectory: String

  var isScoped: Bool = false

  @objc
  public init(documentDirectory: String, cachesDirectory: String, applicationSupportDirectory: String) {
    self.documentDirectory = documentDirectory
    self.cachesDirectory = cachesDirectory
    self.applicationSupportDirectory = applicationSupportDirectory
    self.isScoped = true

    super.init()
    ensureDirExists(withPath: self.cachesDirectory)
    ensureDirExists(withPath: self.documentDirectory)
    ensureDirExists(withPath: self.applicationSupportDirectory)
  }

  required public override init() {
    let documentPaths = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)
    self.documentDirectory = documentPaths[0]

    let cachesPaths = NSSearchPathForDirectoriesInDomains(.cachesDirectory, .userDomainMask, true)
    self.cachesDirectory = cachesPaths[0]

    let applicationSupportDirectoryPaths =
    NSSearchPathForDirectoriesInDomains(.applicationSupportDirectory, .userDomainMask, true)
    self.applicationSupportDirectory = applicationSupportDirectoryPaths[0]

    super.init()
    ensureDirExists(withPath: self.cachesDirectory)
    ensureDirExists(withPath: self.documentDirectory)
    ensureDirExists(withPath: self.applicationSupportDirectory)
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
    guard let url = convertToUrl(string: path) else {
      return []
    }
    let permissionsForInternalDirectories = getInternalPathPermissions(url)
    if !permissionsForInternalDirectories.isEmpty {
      return permissionsForInternalDirectories
    }
    return getExternalPathPermissions(url)
  }

  @objc
  public func getInternalPathPermissions(_ url: URL) -> EXFileSystemPermissionFlags {
    let scopedDirs: [String] = [cachesDirectory, documentDirectory, applicationSupportDirectory]
    let standardizedPath = url.standardized.path
    for scopedDirectory in scopedDirs {
      if standardizedPath.hasPrefix(scopedDirectory + "/") || standardizedPath == scopedDirectory {
        return [.read, .write]
      }
    }
    return []
  }

  @objc
  public func getExternalPathPermissions(_ url: URL) -> EXFileSystemPermissionFlags {
    if self.isScoped && url.path.contains("ExponentExperienceData") {
      return []
    }
    var filePermissions: EXFileSystemPermissionFlags = []
    if FileManager.default.isReadableFile(atPath: url.absoluteString) {
      filePermissions.insert(.read)
    }
    if FileManager.default.isWritableFile(atPath: url.absoluteString) {
      filePermissions.insert(.write)
    }
    return filePermissions
  }
}
