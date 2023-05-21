import CryptoKit
import ExpoModulesCore

private typealias DiskCacheTask = Task<Data?, Error>

var reads = 0
var writes = 0

internal actor DiskCache {
  private var tasks = [String: DiskCacheTask]()
  private let fileManager = FileManager()
  private let cacheDirectoryUrl: URL

  init() {
    cacheDirectoryUrl = getCacheDirectoryUrl(fileManager: fileManager)

    if !fileManager.fileExists(atPath: cacheDirectoryUrl.path) {
      do {
        try fileManager.createDirectory(at: cacheDirectoryUrl, withIntermediateDirectories: true)
      } catch {
        log.error(error.localizedDescription)
      }
    }
  }

  func query(key: String) async -> Data? {
    if let existingTask = tasks[key] {
      return try? await existingTask.value
    }
    let task = runTask(key: key) {
      let fileUrl = self.getCachedFileUrl(key)
      reads += 1
      log.debug("Querying key: \(key), path: \(fileUrl.path), reads: \(reads)")
      return try? Data(contentsOf: fileUrl)
    }
    return try? await task.value
  }

  func store(key: String, data: Data) async {
    // Wait for the existing task to finish
    await tasks[key]?.result

    runTask(key: key) {
      let fileUrl = self.getCachedFileUrl(key)
      log.info("Storing key: \(key), path: \(fileUrl.path), writes: \(writes + 1)")
      try? data.write(to: fileUrl)
      writes += 1
      return data
    }
  }

  func contains(key: String) async -> Bool {
    if let existingTask = tasks[key] {
      let data = try? await existingTask.value
      return data != nil
    }
    let fileUrl = getCachedFileUrl(key)
    let contains = fileManager.fileExists(atPath: fileUrl.path)
    log.trace("Contains (\(contains ? "yes" : "no")) key: \(key), path: \(fileUrl.path)")
    return contains
  }

  func remove(key: String) async {
    // Wait for the existing task to finish
    await tasks[key]?.result

    runTask(key: key) {
      let fileUrl = self.getCachedFileUrl(key)
      try? self.fileManager.removeItem(at: fileUrl)
      return nil
    }
  }

  // MARK: - private

  private func runTask(key: String, action: @escaping () -> Data?) -> DiskCacheTask {
    let task = DiskCacheTask {
      let data = action()
      tasks[key] = nil
      return data
    }
    tasks[key] = task
    return task
  }

  private func getCachedFileUrl(_ key: String) -> URL {
    let fileName = getHashedFileNameForKey(key)
    return cacheDirectoryUrl.appendingPathComponent(fileName, isDirectory: false)
  }
}

private func getCacheDirectoryUrl(fileManager: FileManager) -> URL {
  var url = fileManager.urls(for: .cachesDirectory, in: .userDomainMask)[0]

  url.appendPathComponent("expo.modules.image", isDirectory: true)

  return url
}

private func getHashedFileNameForKey(_ key: String) -> String {
  let data = Data(key.utf8)

  return SHA256
    .hash(data: data)
    .compactMap({ String(format: "%02x", $0) })
    .joined()
}
