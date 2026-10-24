import Foundation

func safeShareFileName(_ name: String?, fallback: String) -> String {
  let safeName = (name ?? "")
    .replacingOccurrences(of: "/", with: "_")
    .replacingOccurrences(of: "\\", with: "_")
    .replacingOccurrences(of: "\u{0}", with: "_")
  return safeName.isEmpty || safeName == "." || safeName == ".." ? fallback : safeName
}

struct ShareIntoFileStore {
  static let staleFileAge: TimeInterval = 24 * 60 * 60

  let rootURL: URL

  init?(appGroupId: String) {
    guard let containerURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupId) else {
      return nil
    }
    rootURL = containerURL.appendingPathComponent("Library/Caches/expo-sharing", isDirectory: true)
  }

  func makeDestination(fileName: String) throws -> URL {
    let directory = rootURL.appendingPathComponent(UUID().uuidString, isDirectory: true)
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    return directory.appendingPathComponent(fileName, isDirectory: false)
  }

  func removeStaleFiles() {
    let fileManager = FileManager.default
    guard let directories = try? fileManager.contentsOfDirectory(at: rootURL, includingPropertiesForKeys: [.creationDateKey]) else {
      return
    }
    let threshold = Date().addingTimeInterval(-Self.staleFileAge)
    for directory in directories {
      let createdAt = try? directory.resourceValues(forKeys: [.creationDateKey]).creationDate
      if let createdAt, createdAt < threshold {
        try? fileManager.removeItem(at: directory)
      }
    }
  }

  func removeAll() {
    try? FileManager.default.removeItem(at: rootURL)
  }
}
