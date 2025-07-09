import Foundation
import ExpoModulesCore

class MediaInfo: Codable {
  var expectedContentLength: Int64
  var supportsByteRangeAccess: Bool
  var mimeType: String?
  var headerFields: [String: String]?
  var savePath: String

  // Tuples can't be encoded/decoded, so we workaround that with an array
  private var loadedDataRangesArr: [[Int]] = []
  private(set) var loadedDataRanges: [(Int, Int)] {
    get {
      return loadedDataRangesArrayToTuple()
    }
    set {
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
    self.loadedDataRanges = loadedDataRanges

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

  func addDataRange(newDataRange: (Int, Int)) {
    var i = 0
    var merged = [(Int, Int)]()

    // Add all intervals before newInterval starts
    while i < loadedDataRanges.count && loadedDataRanges[i].1 < newDataRange.0 {
      merged.append(loadedDataRanges[i])
      i += 1
    }

    // Merge all overlapping intervals to one new Interval
    var newStart = newDataRange.0
    var newEnd = newDataRange.1
    while i < loadedDataRanges.count && loadedDataRanges[i].0 <= newDataRange.1 {
      newStart = min(newStart, loadedDataRanges[i].0)
      newEnd = max(newEnd, loadedDataRanges[i].1)
      i += 1
    }
    merged.append((newStart, newEnd))

    // Add remaining intervals
    while i < loadedDataRanges.count {
      merged.append(loadedDataRanges[i])
      i += 1
    }
    loadedDataRanges = merged
  }

  func encodeToData() -> Data? {
    do {
      return try JSONEncoder().encode(self)
    } catch {
      log.warn("Error encoding MediaInfo object: \(error)")
      return nil
    }
  }

  // Saves the mime type of a video fetched from the server into a file. This allows playing videos without an extension in the
  // url.
  func saveToFile() {
    do {
      if FileManager.default.fileExists(atPath: savePath) {
        try FileManager.default.removeItem(atPath: savePath)
      }

      FileManager.default.createFile(atPath: savePath, contents: self.encodeToData())
    } catch {
      log.warn("Failed to save media info at: \(savePath)")
    }
  }

  private func loadedDataRangesArrayToTuple() -> [(Int, Int)] {
    // The filter shouldn't be necessary, but we can't be too careful
    let filteredDataRanges = loadedDataRangesArr.filter { rangeArray in
      rangeArray.count == 2
    }

    return filteredDataRanges.map { rangeArray in
      (rangeArray[0], rangeArray[1])
    }
  }

  private func loadedDataRangesTupleToArray(_ loadedDataRanges: [(Int, Int)]) -> [[Int]] {
    return loadedDataRanges.map { from, to in
      return [from, to]
    }
  }
}
