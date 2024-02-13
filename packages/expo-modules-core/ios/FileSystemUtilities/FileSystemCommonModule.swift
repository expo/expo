//
//  FileSystemCommonModule.swift
//  ExpoModulesCore
//
//  Created by Aleksander Mikucki on 13/02/2024.
//

import Foundation

class FileSystemCommonModule: EXFileSystemInterface {
  
  var appContext: AppContext!;
  
  init(_ appContext: AppContext?) {
    self.appContext = appContext
  }
  
  var documentDirectory: String! {
    get {
      return appContext?.config.documentDirectory?.absoluteString
    }
  }
  
  var cachesDirectory: String! {
    get {
      return appContext?.config.cacheDirectory?.absoluteString
    }
  }
  
  func permissions(forURI uri: URL!) -> EXFileSystemPermissionFlags {
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
      return getPathPermissions(uri)

    }
    return []
  }
  
  func generatePath(inDirectory directory: String!, withExtension ext: String!) -> String {
    let fileName = "\(UUID().uuidString)\(ext)"
    ensureDirExists(withPath: directory)
    return (directory as NSString).appendingPathComponent(fileName)
  }
  
  func ensureDirExists(withPath path: String!) -> Bool {
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
  
  func getPathPermissions(_ path: URL) -> EXFileSystemPermissionFlags {
      let permissionsForInternalDirectories = getInternalPathPermissions(path)
    if permissionsForInternalDirectories != [] {
          return permissionsForInternalDirectories
      } else {
          return getExternalPathPermissions(path)
      }
  }

  func getInternalPathPermissions(_ path: URL) -> EXFileSystemPermissionFlags {
      let scopedDirs: [String] = [cachesDirectory, documentDirectory]
      let standardizedPath = path.standardized.path
      
      for scopedDirectory in scopedDirs {
          if standardizedPath.hasPrefix(scopedDirectory + "/") || standardizedPath == scopedDirectory {
              return [.read, .write]
          }
      }
      
      return []
  }

  func getExternalPathPermissions(_ path: URL) -> EXFileSystemPermissionFlags {
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
