import Foundation

class VideoCacheManager {
  static let defaultMaxCacheCount = 100 // At most 100 videos in the cache
  static let defaultMaxCacheSize = 512_000_000 // 512MB
  static let defaultMaxCacheAge = 60 * 60 * 24 * 30 // 30 days
  static let defaultAutoCleanCache = true
  static let expoVideoCacheScheme = "expo-video-cache"
  static let expoVideoCacheDirectory = "expo-video-cache"
  static let mimeTypeSuffix = "&mimeType"

  static let shared = VideoCacheManager()
  private let defaults = UserDefaults.standard

  private let autoCleanCacheKey = "\(VideoCacheManager.expoVideoCacheScheme)/autoCleanCache"
  private let maxCacheCountKey = "\(VideoCacheManager.expoVideoCacheScheme)/maxCacheCount"
  private let maxCacheSizeKey = "\(VideoCacheManager.expoVideoCacheScheme)/maxCacheSize"
  private let maxCacheAgeKey = "\(VideoCacheManager.expoVideoCacheScheme)/maxCacheAge"

  // Files currently being used/modified by the player
  private var openFiles: [URL] = []

  // We run the clean commands on a separate queue to avoid trying to remove the same value twice when two cleans are called close to each other
  private let clearingQueue = DispatchQueue(label: "\(VideoCacheManager.expoVideoCacheScheme)-dispatch-queue")

  private(set) var maxCacheCount: Int {
    get {
      defaults.maybeInteger(forKey: maxCacheCountKey) ?? Self.defaultMaxCacheCount
    }
    set {
      defaults.setValue(newValue, forKey: maxCacheCountKey)
    }
  }

  private(set) var maxCacheSize: Int {
    get {
      defaults.maybeInteger(forKey: maxCacheSizeKey) ?? Self.defaultMaxCacheSize
    }
    set {
      defaults.setValue(newValue, forKey: maxCacheSizeKey)
    }
  }

  private(set) var maxCacheAge: Int {
    get {
      defaults.maybeInteger(forKey: maxCacheAgeKey) ?? Self.defaultMaxCacheAge
    }
    set {
      defaults.setValue(newValue, forKey: maxCacheAgeKey)
    }
  }

  private(set) var autoCleanCache: Bool {
    get {
      defaults.maybeBool(forKey: autoCleanCacheKey) ?? Self.defaultAutoCleanCache
    }
    set {
      defaults.setValue(newValue, forKey: autoCleanCacheKey)
    }
  }

  // TODO: find a better way to do this
  func registerOpenFile(at url: URL) {
    if !openFiles.contains(url) {
      openFiles.append(url)
    }
  }

  func unregisterOpenFile(at url: URL) {
    openFiles.removeAll { $0 == url }
  }

  func maybeAutoCleanCache() {
    if autoCleanCache {
      cleanCache()
    }
  }

  func cleanCache() {
    clearingQueue.async { [weak self] in
      self?._cleanCache()
    }
  }

   func cleanAllCache() {
    clearingQueue.async { [weak self] in
      try? self?.deleteAllFilesInCacheDirectory()
    }
  }

  private func _cleanCache() {
    do {
      let fileURLs = try getVideoFilesUrls()
      let safeFileURLs = fileURLs.filter { !shouldSkipUrl(url: $0) }
      let ageLimitedURLs = try deleteFilesOlderThan(seconds: maxCacheAge, from: safeFileURLs)
      // Offset the count by the files we are ignoring
      let keepRecentCount = maxCacheCount - fileURLs.count + safeFileURLs.count
      let countLimitedURLs = try keepRecentFiles(count: keepRecentCount, in: ageLimitedURLs)
      _ = try limitCacheSize(to: maxCacheSize, in: countLimitedURLs)
    } catch {
      print("Failed to clear the cache: \(error.localizedDescription)")
    }
  }

  func deleteFilesOlderThan(seconds: Int, from fileUrls: [URL]) throws -> [URL] {
    let dateLimit = Date(timeIntervalSinceNow: TimeInterval(-seconds))
    var remainingFiles = [URL]()

    for fileUrl in fileUrls {
      let modificationDate = try fileUrl.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate
      if let date = modificationDate, date < dateLimit {
        try removeVideoAndMimeTypeFile(at: fileUrl)
      } else {
        remainingFiles.append(fileUrl)
      }
    }

    return remainingFiles
  }

  func keepRecentFiles(count: Int, in fileURLs: [URL]) throws -> [URL] {
    let sortedFiles = fileURLs.sorted {
      let date0 = (try? $0.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate) ?? Date.distantPast
      let date1 = (try? $1.resourceValues(forKeys: [.contentModificationDateKey]).contentModificationDate) ?? Date.distantPast
      return date0 > date1
    }

    let filesToKeep = Array(sortedFiles.prefix(count))
    let filesToDelete = sortedFiles.dropFirst(count)

    for file in filesToDelete {
      try removeVideoAndMimeTypeFile(at: file)
    }

    return filesToKeep
  }

  func limitCacheSize(to maxSize: Int, in fileURLs: [URL]) throws -> [URL] {
    var totalSize: Int64 = 0
    var fileInfo = [(url: URL, size: Int64, accessDate: Date)]()

    for url in fileURLs {
      let attributes = try FileManager.default.attributesOfItem(atPath: url.path)
      let fileSize = attributes[.size] as? Int64 ?? 0
      let accessDate = try url.resourceValues(forKeys: [.contentAccessDateKey]).contentAccessDate ?? Date.distantPast
      totalSize += fileSize
      fileInfo.append((url: url, size: fileSize, accessDate: accessDate))
    }

    if totalSize <= maxSize {
      return fileURLs
    }

    let sortedFiles = fileInfo.sorted { $0.accessDate < $1.accessDate }
    var remainingFiles = [URL]()

    for file in sortedFiles {
      if totalSize <= maxSize {
        remainingFiles.append(file.url)
        continue
      }
      try removeVideoAndMimeTypeFile(at: file.url)
      totalSize -= file.size
    }

    return remainingFiles
  }

  private func deleteAllFilesInCacheDirectory() throws -> Int {
    guard let cacheDirectory = getCacheDirectory() else {
      return 0
    }

    let fileUrls = try FileManager.default.contentsOfDirectory(at: cacheDirectory, includingPropertiesForKeys: nil, options: [])
    var deletedFilesCount = 0

    for fileUrl in fileUrls {
      try removeVideoAndMimeTypeFile(at: fileUrl)
      deletedFilesCount += 1
    }

    return deletedFilesCount
  }

  func removeVideoAndMimeTypeFile(at fileUrl: URL) throws {
    let mimeTypeFileUrl = URL(string: "\(fileUrl.relativeString)\(Self.mimeTypeSuffix)")
    try FileManager.default.removeItem(at: fileUrl)
    if let mimeTypeFileUrl, FileManager.default.fileExists(atPath: mimeTypeFileUrl.relativePath) {
      try FileManager.default.removeItem(at: mimeTypeFileUrl)
    }
  }

  func getCacheDirectory() -> URL? {
    let cacheDirs = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)
    if let cacheDir = cacheDirs.first {
      let videoCacheDir = cacheDir.appendingPathComponent(VideoCacheManager.expoVideoCacheDirectory)
      return videoCacheDir
    }
    return nil
  }

  func getVideoFilesUrls() throws -> [URL] {
    guard let videoCacheDir = getCacheDirectory() else {
      print("Failed to get the video cache directory.")
      return []
    }
    let fileURLs = (try? FileManager.default.contentsOfDirectory(at: videoCacheDir, includingPropertiesForKeys: [.contentAccessDateKey, .contentModificationDateKey], options: .skipsHiddenFiles)) ?? []
    return fileURLs.filter { !$0.absoluteString.hasSuffix(Self.mimeTypeSuffix)}
  }

  func shouldSkipUrl(url: URL) -> Bool {
    return openFiles.contains { $0.relativePath == url.relativePath }
  }
}

private extension UserDefaults {
  func exists(forKey key: String) -> Bool {
    return Self.standard.object(forKey: key) != nil
  }

  func maybeBool(forKey key: String) -> Bool? {
    Self.standard.exists(forKey: key) ? Self.standard.bool(forKey: key) : nil
  }

  func maybeInteger(forKey key: String) -> Int? {
    Self.standard.exists(forKey: key) ? Self.standard.integer(forKey: key) : nil
  }
}
