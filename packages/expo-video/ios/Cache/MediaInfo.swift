import Foundation
import ExpoModulesCore

class MediaInfo: Codable {
  var expectedContentLength: Int64
  var supportsByteRangeAccess: Bool
  var mimeType: String?
  var headerFields: [String: String]?
  var savePath: String

  // Tuples can't be encoded/decoded, so we workaround that with an array
  private var loadedDataRangesArr: Array<Array<Int>> = []
  var loadedDataRanges: Array<(Int, Int)> {
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
      self.init(expectedContentLength: mediaInfo.expectedContentLength,
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
    guard (FileManager.default.fileExists(atPath: path)),
          let mediaInfoData = FileManager.default.contents(atPath: path) else {
      return nil
    }
    self.init(data: mediaInfoData, dataPath: path)
  }

  convenience init?(forResourceUrl url: URL) {
    guard let filePath = CachingPlayerItem.pathForUrl(url: url, fileExtension: url.pathExtension) else {
      return nil
    }
    let mediaInfoPath = filePath + VideoCacheManager.mediaInfoSuffix
    self.init(at: mediaInfoPath)
  }

  func encodeToData() -> Data? {
    do {
      let jsonData = try JSONEncoder().encode(self)
      return jsonData
    } catch {
      log.warn("Error encoding MediaInfo object: \(error)")
      return nil
    }
  }

  // Saves the mime type of a video fetched from the server into a file. This allows playing videos without an extension in the
  // url.
  func saveToFile() {
    do {
      if (FileManager.default.fileExists(atPath: savePath)) {
        try FileManager.default.removeItem(atPath: savePath)
      }

      FileManager.default.createFile(atPath: savePath, contents: self.encodeToData())
    } catch {
      log.warn("Failed to save media info at: \(savePath)")
    }
  }

  private func loadedDataRangesArrayToTuple() -> Array<(Int, Int)> {
    // The filter shouldn't be necessary, but we can't be too careful
    return loadedDataRangesArr.filter({ rangeArray in
      rangeArray.count == 2
    }).map { rangeArray in
      (rangeArray[0], rangeArray[1])
    }
  }

  private func loadedDataRangesTupleToArray(_ loadedDataRanges: Array<(Int, Int)>) -> Array<Array<Int>> {
    return loadedDataRanges.map { (from, to) in
      return [from, to]
    }
  }
}
