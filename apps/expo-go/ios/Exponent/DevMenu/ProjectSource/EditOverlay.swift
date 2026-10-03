// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Session-scoped store of local edits: the single source of truth views read
/// file contents through. Lives as long as the ProjectSourceSession, so edits
/// survive closing files and reloading the project, and vanish with it.
@MainActor
final class EditOverlay: ObservableObject {
  struct EditedFile {
    let original: String
    var current: String
  }

  @Published private(set) var edits: [String: EditedFile] = [:]

  var hasEdits: Bool {
    !edits.isEmpty
  }

  func currentContents(forPath path: String) -> String? {
    edits[path]?.current
  }

  func recordEdit(path: String, original: String, newContents: String) {
    let trueOriginal = edits[path]?.original ?? original
    if newContents == trueOriginal {
      edits.removeValue(forKey: path)
      return
    }
    edits[path] = EditedFile(original: trueOriginal, current: newContents)
  }

  func revertAll() {
    edits = [:]
  }
}
