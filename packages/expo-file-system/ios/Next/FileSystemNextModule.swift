// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class FileSystemNextModule: Module {
  public func definition() -> ModuleDefinition {
    Name("FileSystemNext")

    Class(FileSystemFile.self) {
      Constructor { (url: URL) in
        return FileSystemFile(url: url.standardizedFileURL)
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
    }

    Class(FileSystemDirectory.self) {
      Constructor { (url: URL) in
        return FileSystemDirectory(url: url.standardizedFileURL)
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
    }
  }
}
