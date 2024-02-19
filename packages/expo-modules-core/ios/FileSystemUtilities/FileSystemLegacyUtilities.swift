//
//  FileSystemCommonModule.swift
//  ExpoModulesCore
//
//  Created by Aleksander Mikucki on 13/02/2024.
//

import Foundation

@objc(EXFileSystemLegacyUtilities)
public class FileSystemLegacyUtilities: EXExportedModule, EXFileSystemInterface, EXFilePermissionModuleInterface {
  @objc
  public var documentDirectory: String

  @objc
  public var cachesDirectory: String

  @objc
  public init(documentDirectory: String, cachesDirectory: String) {
    self.documentDirectory = documentDirectory
    self.cachesDirectory = cachesDirectory
  }

  public override init() {
    let documentPaths = NSSearchPathForDirectoriesInDomains(.documentDirectory, .userDomainMask, true)
    self.documentDirectory = documentPaths[0]

    let cachesPaths = NSSearchPathForDirectoriesInDomains(.cachesDirectory, .userDomainMask, true)
    self.cachesDirectory = cachesPaths[0]
  }

  @objc
  override public class func exportedModuleName() -> String {
    return "EXFileSystemLegacyUtilities"
  }

  @objc
  public func permissions(forURI uri: URL) -> EXFileSystemPermissionFlags {
    let validSchemas: [String] = [
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
  public override static func exportedInterfaces() -> [Protocol] {
    return [EXFileSystemInterface.self]
  }

  @objc
  public func generatePath(inDirectory directory: String, withExtension ext: String) -> String {
    let fileName = "\(UUID().uuidString)\(String(describing: ext))"
    ensureDirExists(withPath: directory)
    return (directory as NSString).appendingPathComponent(fileName)
  }

  @objc
  public func ensureDirExists(withPath path: String) -> Bool {
    var isDir: ObjCBool = false
    let exists = FileManager.default.fileExists(atPath: path, isDirectory: &isDir)
    if !(exists && isDir.boolValue) {
      do {
        try FileManager.default.createDirectory(atPath: path, withIntermediateDirectories: true, attributes: nil)
      } catch {
        return false
      }
    }
    return true
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
