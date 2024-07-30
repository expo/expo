import Foundation

class VideoCacheManager {
  public static let expoVideoCacheScheme = "expo-video-cache"
  public static let mimeTypeSuffix = "&mimeType"
  static var shared = VideoCacheManager()
  let infoPlist = Bundle.main.infoDictionary
  let maxCacheCount: Int

  init() {
    self.maxCacheCount = Bundle.main.infoDictionary?["NSVideoCacheMaxCount"] as? Int ?? 10
  }

  func removeUnusedCache() {
    cleanUpOldFiles(keepingRecentFilesCount: maxCacheCount)
  }

  func cleanUpOldFiles(keepingRecentFilesCount count: Int) {
    guard let videoCacheDir = getCacheDirectory() else {
      print("Failed to get the video cache directory.")
      return
    }

    do {
      // Get all file URLs in the directory
      let fileURLs = try FileManager.default.contentsOfDirectory(at: videoCacheDir, includingPropertiesForKeys: [.contentModificationDateKey], options: .skipsHiddenFiles)

      // Filter out the directories and files with specific suffix
      let filteredFiles = fileURLs.filter { $0.lastPathComponent != VideoCacheManager.mimeTypeSuffix && $0.hasDirectoryPath == false }

      // Sort files by modification date from newest to oldest
      let sortedFiles = filteredFiles.sorted {
        let date0 = try? $0.resourceValues(forKeys: [.contentAccessDateKey]).contentModificationDate
        let date1 = try? $1.resourceValues(forKeys: [.contentAccessDateKey]).contentModificationDate
        return date0 ?? Date.distantPast > date1 ?? Date.distantPast
      }

      // Get files to delete, excluding the 10 most recent ones
      let filesToDelete = sortedFiles.dropFirst(count)

      // Now delete these files
      for file in filesToDelete {
        try FileManager.default.removeItem(at: file)
      }

      print("Deleted \(filesToDelete.count) files.")

    } catch {
      print("An error occurred while cleaning up old files: \(error)")
    }
  }

  func getCacheDirectory() -> URL? {
    let cacheDirs = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)
    if let cacheDir = cacheDirs.first {
      let videoCacheDir = cacheDir.appendingPathComponent(VideoCacheManager.expoVideoCacheScheme)
      return videoCacheDir
    }
    return nil
  }
}
