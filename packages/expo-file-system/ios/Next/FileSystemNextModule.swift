// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class FileSystemNextModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FileSystemNext")

    Class(FileSystemNextFile.self) {
      Constructor { (url: URL) in
        return FileSystemNextFile(url: url)
      }

      // we can't throw in a constructor, so this is a workaround
      Function("validatePath") { file in
        try file.validatePath()
      }

      // maybe asString, readAsString, readAsText, readText, ect.
      Function("text") { file in
        return try file.text()
      }

      Function("write") { (file, content: Either<String, TypedArray>) in
        try file.write(content)
      }

      Function("delete") { file in
        try file.delete()
      }

      Function("exists") { file in
        return file.exists()
      }

      Function("create") { file in
        file.create()
      }

      Property("path") { file in
        return file.url.absoluteString
      }
      .set { (file, value: URL) in
        // document this does not copy/move the file, only changes the ref
        file.url = value
      }
    }

    Class(FileSystemNextDirectory.self) {
      Constructor { (url: URL) in
        return FileSystemNextDirectory(url: url)
      }

      // we can't throw in a constructor, so this is a workaround
      Function("validatePath") { directory in
        try directory.validatePath()
      }

      Function("delete") { directory in
        try directory.delete()
      }

      Function("exists") { directory in
        return directory.exists()
      }

      Function("create") { directory in
        try directory.create()
      }

      Property("path") { directory in
        return directory.url.absoluteString
      }
      .set { (directory, value: URL) in
        // document this does not copy/move the file, only changes the ref
        directory.url = value
      }
    }
  }
}
