// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Photos

private let assetIdentifier = "ph://"

internal func ensureFileDirectoryExists(_ fileUrl: URL) throws {
  let directoryPath = fileUrl.deletingLastPathComponent()

  if !FileManager.default.fileExists(atPath: directoryPath.path) {
    throw DirectoryNotExistsException(directoryPath.path)
  }
}

internal func readFileAsBase64(path: String, options: ReadingOptions) throws -> String {
  let file = FileHandle(forReadingAtPath: path)

  guard let file else {
    throw FileNotExistsException(path)
  }
  if let position = options.position, position != 0 {
    // TODO: Handle these errors?
    try? file.seek(toOffset: UInt64(position))
  }
  if let length = options.length {
    return file.readData(ofLength: length).base64EncodedString(options: .endLineWithLineFeed)
  }
  return file.readDataToEndOfFile().base64EncodedString(options: .endLineWithLineFeed)
}

internal func writeFileAsBase64(path: String, string: String, position: Int? = nil) throws {
  let data = Data(base64Encoded: string, options: .ignoreUnknownCharacters)

  guard let data else {
    throw FileWriteFailedException(path)
  }

  if let position = position {
    try writeDataAtPosition(path: path, data: data, position: position)
  } else {
    if !FileManager.default.createFile(atPath: path, contents: data) {
      throw FileWriteFailedException(path)
    }
  }
}

internal func writeStringAtPosition(path: String, string: String, position: Int, encoding: String.Encoding) throws {
  guard let data = string.data(using: encoding) else {
    throw FileNotWritableException(path)
  }

  try writeDataAtPosition(path: path, data: data, position: position)
}

internal func writeDataAtPosition(path: String, data: Data, position: Int) throws {
  // Ensure file exists - create if doesn't exist
  if !FileManager.default.fileExists(atPath: path) {
    FileManager.default.createFile(atPath: path, contents: nil)
  }

  guard let fileHandle = FileHandle(forWritingAtPath: path) else {
    throw FileNotWritableException(path)
  }

  defer {
    try? fileHandle.close()
  }

  do {
    try fileHandle.seek(toOffset: UInt64(position))
    try fileHandle.write(contentsOf: data)
  } catch {
    throw FileNotWritableException(path).causedBy(error)
  }
}

internal func removeFile(path: String, idempotent: Bool = false) throws {
  if FileManager.default.fileExists(atPath: path) {
    do {
      try FileManager.default.removeItem(atPath: path)
    } catch {
      throw FileCannotDeleteException(path)
        .causedBy(error)
    }
  } else if !idempotent {
    throw FileCannotDeleteException(path)
      .causedBy(FileNotExistsException(path))
  }
}

internal func getResourceValues(from directory: URL?, forKeys: Set<URLResourceKey>) throws -> URLResourceValues? {
  do {
    return try directory?.resourceValues(forKeys: forKeys)
  } catch {
    throw CannotDetermineDiskCapacity().causedBy(error)
  }
}

internal func ensurePathPermission(_ appContext: AppContext?, path: String, flag: EXFileSystemPermissionFlags) throws {
  guard let permissionsManager: EXFilePermissionModuleInterface = appContext?.legacyModule(implementing: EXFilePermissionModuleInterface.self) else {
    throw Exceptions.PermissionsModuleNotFound()
  }
  guard permissionsManager.getPathPermissions(path).contains(flag) else {
    throw flag == .read ? FileNotReadableException(path) : FileNotWritableException(path)
  }
}

internal func isPHAsset(path: String) -> Bool {
  return path.contains(assetIdentifier)
}

internal func copyPHAsset(fromUrl: URL, toUrl: URL, with resourceManager: PHAssetResourceManager, promise: Promise) {
  if isPhotoLibraryStatusAuthorized() {
    if FileManager.default.fileExists(atPath: toUrl.path) {
      promise.reject(FileAlreadyExistsException(toUrl.path))
      return
    }

    let identifier = fromUrl.absoluteString.replacingOccurrences(of: assetIdentifier, with: "")

    guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [identifier], options: nil).firstObject else {
      promise.reject(FailedToFindAssetException(fromUrl.absoluteString))
      return
    }

    let firstResource = PHAssetResource.assetResources(for: asset).first
    if let firstResource {
      resourceManager.writeData(for: firstResource, toFile: toUrl, options: nil) { error in
        if error != nil {
          promise.reject(FailedToCopyAssetException(fromUrl.absoluteString))
          return
        }
        promise.resolve()
      }
    } else {
      promise.reject(FailedToCopyAssetException(fromUrl.absoluteString))
    }
  }
}

internal func isPhotoLibraryStatusAuthorized() -> Bool {
  if #available(iOS 14, tvOS 14, *) {
    let status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
    return status == .authorized || status == .limited
  }
  return PHPhotoLibrary.authorizationStatus() == .authorized
}
