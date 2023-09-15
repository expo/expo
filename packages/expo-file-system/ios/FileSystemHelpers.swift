// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

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

internal func writeFileAsBase64(path: String, string: String) throws {
  let data = Data(base64Encoded: string, options: .ignoreUnknownCharacters)

  if !FileManager.default.createFile(atPath: path, contents: data) {
    throw FileWriteFailedException(path)
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
