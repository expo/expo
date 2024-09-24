import Foundation
import ExpoModulesCore

class MediaInfo: Codable {
  var expectedContentLength: Int64
  var supportsByteRangeAccess: Bool
  var mimeType: String?
  var headerFields: [String: String]?

  // Tuples can't be encoded/decoded, so we workaround that with an array
  private var loadedDataRangesArr: Array<Array<Int>> = []
  var loadedDataRanges: Array<(Int, Int)> {
    get {
      return loadedDataRangesArrToTuple()
    }
    set {
      loadedDataRangesArr = loadedDataRangesTupleToArr(newValue)
    }
  }

  private enum CodingKeys: String, CodingKey {
    case expectedContentLength, supportsByteRangeAccess, mimeType, loadedDataRangesArr, headerFields
  }

  init(expectedContentLength: Int64, mimeType: String?, supportsByteRangeAccess: Bool, headerFields: [String: String]?) {
    self.mimeType = mimeType
    self.supportsByteRangeAccess = supportsByteRangeAccess
    self.expectedContentLength = expectedContentLength
    self.headerFields = headerFields
    self.loadedDataRangesArr = loadedDataRangesTupleToArr(loadedDataRanges)
  }

  convenience init?(data: Data) {
    do {
      let mediaInfo = try JSONDecoder().decode(MediaInfo.self, from: data)
      self.init(expectedContentLength: mediaInfo.expectedContentLength,
                mimeType: mediaInfo.mimeType,
                supportsByteRangeAccess: mediaInfo.supportsByteRangeAccess,
                headerFields: mediaInfo.headerFields)
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
    self.init(data: mediaInfoData)
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
  

  private func loadedDataRangesArrToTuple() -> Array<(Int, Int)> {
    return loadedDataRangesArr.map { rangeArray in
      (rangeArray[0], rangeArray[1])
    }
  }

  private func loadedDataRangesTupleToArr(_ loadedDataRanges: Array<(Int, Int)>) -> Array<Array<Int>> {
    return loadedDataRanges.map { (from, to) in
      return [from, to]
    }
  }
}
