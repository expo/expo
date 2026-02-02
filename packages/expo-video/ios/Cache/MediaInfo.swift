import Foundation
import ExpoModulesCore

class MediaInfo: Codable {
  var expectedContentLength: Int64
  var supportsByteRangeAccess: Bool
  var mimeType: String?
  var headerFields: [String: String]?
  var savePath: String

  // Lock to protect loadedDataRanges from concurrent access
  private let lock = NSLock()

  // Tuples can't be encoded/decoded, so we workaround that with an array
  // Ranges are stored as half-open intervals: [start, end) where end is exclusive
  private var loadedDataRangesArr: [[Int64]] = []
  private(set) var loadedDataRanges: [(Int64, Int64)] {
    get {
      lock.lock()
      defer { lock.unlock() }
      return loadedDataRangesArrayToTuple()
    }
    set {
      lock.lock()
      defer { lock.unlock() }
      loadedDataRangesArr = loadedDataRangesTupleToArray(newValue)
    }
  }

  private enum CodingKeys: String, CodingKey {
    case expectedContentLength, supportsByteRangeAccess, mimeType, loadedDataRangesArr, headerFields, savePath
  }

  init(expectedContentLength: Int64, mimeType: String?, supportsByteRangeAccess: Bool, headerFields: [String: String]?, savePath: String) {
    self.mimeType = mimeType
    self.supportsByteRangeAccess = supportsByteRangeAccess
    self.expectedContentLength = expectedContentLength
    self.headerFields = headerFields
    self.savePath = savePath

    if let url = URL(string: savePath) {
      VideoCacheManager.shared.registerOpenFile(at: url)
    }
  }

  deinit {
    if let url = URL(string: savePath) {
      VideoCacheManager.shared.unregisterOpenFile(at: url)
    }
  }

  convenience init?(data: Data, dataPath: String) {
    do {
      let mediaInfo = try JSONDecoder().decode(MediaInfo.self, from: data)
      self.init(
        expectedContentLength: mediaInfo.expectedContentLength,
        mimeType: mediaInfo.mimeType,
        supportsByteRangeAccess: mediaInfo.supportsByteRangeAccess,
        headerFields: mediaInfo.headerFields,
        savePath: mediaInfo.savePath)
      self.loadedDataRanges = mediaInfo.loadedDataRanges
    } catch {
      return nil
    }
  }

  convenience init?(at path: String) {
    guard FileManager.default.fileExists(atPath: path), let mediaInfoData = FileManager.default.contents(atPath: path) else {
      return nil
    }
    self.init(data: mediaInfoData, dataPath: path)
  }

  convenience init?(forResourceUrl url: URL) {
    guard let filePath = VideoAsset.pathForUrl(url: url, fileExtension: url.pathExtension) else {
      return nil
    }
    let mediaInfoPath = filePath + VideoCacheManager.mediaInfoSuffix
    self.init(at: mediaInfoPath)
  }

  // Adds a new data range and merges with overlapping/adjacent ranges
  func addDataRange(newDataRange: (Int64, Int64)) {
    lock.lock()
    defer { lock.unlock() }

    // Validate empty or invalid ranges
    guard newDataRange.1 > newDataRange.0 else {
      log.warn("[expo-video] Invalid range: [\(newDataRange.0), \(newDataRange.1)) - end must be > start")
      return
    }

    // Access the array directly to avoid deadlock (the getter acquires the lock)
    let currentRanges = loadedDataRangesArrayToTuple()

    var i = 0
    var merged = [(Int64, Int64)]()

    // Add all intervals that end before the new interval starts (non-adjacent)
    while i < currentRanges.count && currentRanges[i].1 < newDataRange.0 {
      merged.append(currentRanges[i])
      i += 1
    }

    // Merge all overlapping or adjacent intervals to one new interval
    var newStart = newDataRange.0
    var newEnd = newDataRange.1
    while i < currentRanges.count && currentRanges[i].0 <= newDataRange.1 {
      newStart = min(newStart, currentRanges[i].0)
      newEnd = max(newEnd, currentRanges[i].1)
      i += 1
    }
    merged.append((newStart, newEnd))

    // Add remaining intervals
    while i < currentRanges.count {
      merged.append(currentRanges[i])
      i += 1
    }
    loadedDataRangesArr = loadedDataRangesTupleToArray(merged)
  }

  func encodeToData() -> Data? {
    do {
      return try JSONEncoder().encode(self)
    } catch {
      log.warn("[expo-video] Error encoding MediaInfo object: \(error)")
      return nil
    }
  }

  // Saves the mime type of a video fetched from the server into a file. This allows playing videos without an extension in the
  // url. Writes to a temporary file first, then atomically replaces the original
  func saveToFile() {
    do {
      guard let data = self.encodeToData() else {
        log.warn("[expo-video] Failed to encode MediaInfo for saving at: \(savePath)")
        return
      }

      let tempPath = savePath + ".tmp"
      let tempURL = URL(fileURLWithPath: tempPath)
      let finalURL = URL(fileURLWithPath: savePath)

      let parentDirectory = finalURL.deletingLastPathComponent()
      if !FileManager.default.fileExists(atPath: parentDirectory.path) {
        try FileManager.default.createDirectory(at: parentDirectory, withIntermediateDirectories: true, attributes: nil)
      }

      if !FileManager.default.fileExists(atPath: tempPath) && FileManager.default.fileExists(atPath: savePath) {
        try FileManager.default.copyItem(at: finalURL, to: tempURL)
      }

      // Write to temporary file first
      try data.write(to: tempURL, options: .atomic)

      // If original file exists, remove it first
      if FileManager.default.fileExists(atPath: savePath) {
        try FileManager.default.removeItem(at: finalURL)
      }

      // Atomically move temp file to final location
      try FileManager.default.moveItem(at: tempURL, to: finalURL)
    } catch {
      log.warn("[expo-video] Failed to save media info at: \(savePath), error: \(error)")
    }
  }

  private func loadedDataRangesArrayToTuple() -> [(Int64, Int64)] {
    // The filter shouldn't be necessary, but we can't be too careful
    let filteredDataRanges = loadedDataRangesArr.filter { rangeArray in
      rangeArray.count == 2
    }

    return filteredDataRanges.map { rangeArray in
      (rangeArray[0], rangeArray[1])
    }
  }

  private func loadedDataRangesTupleToArray(_ loadedDataRanges: [(Int64, Int64)]) -> [[Int64]] {
    return loadedDataRanges.map { from, to in
      return [from, to]
    }
  }
}
