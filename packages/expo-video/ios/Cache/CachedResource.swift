import Foundation
import AVFoundation
import ExpoModulesCore

/**
 * Class used to manage a single cached resource.  Stores a fileHandle to saved video data, as well as allows saving/loading data used to correctly decode the data.
 */
class CachedResource {
  private let url: URL
  private let dataPath: String
  private let fileHandle: MediaFileHandle
  private(set) lazy var mediaInfo: MediaInfo? = readMediaInfo()

  init(dataFileUrl: String, resourceUrl: URL, dataPath: String) {
    url = resourceUrl
    fileHandle = MediaFileHandle(filePath: dataFileUrl)
    self.dataPath = dataPath
  }

  func onResponseReceived(response: HTTPURLResponse) {
    guard let headers = response.allHeaderFields as? [String: String], mediaInfo == nil, response.statusCode == 200 else {
      return
    }

    mediaInfo = MediaInfo(
      expectedContentLength: response.expectedContentLength,
      mimeType: response.mimeType,
      supportsByteRangeAccess: urlResponseSupportsByteRangeAcces(response),
      headerFields: headers
    )
  }

  func fill(forLoadingRequest request: AVAssetResourceLoadingRequest) {
    guard let mediaInfo, 
          let mimeType = mediaInfo.mimeType,
          let dataRequest = request.dataRequest else {
      return
    }
    let fakeResponse = HTTPURLResponse(url: url, statusCode: 200, httpVersion: nil, headerFields: mediaInfo.headerFields)
    let contentType = UTType(mimeType: mimeType)?.identifier
    if let contentType {
      request.contentInformationRequest?.contentType = contentType
      request.contentInformationRequest?.contentLength = mediaInfo.expectedContentLength
      request.contentInformationRequest?.isByteRangeAccessSupported = mediaInfo.supportsByteRangeAccess
      request.response = fakeResponse
    }
  }

  func writeData(data: Data, offset: Int64) {
    do {
      if let loadedDataRanges = mediaInfo?.loadedDataRanges {
        mediaInfo?.loadedDataRanges = insertAndMerge(
          loadedDataRanges: loadedDataRanges,
          newDataRange: (Int(offset), Int(offset) + data.count))
      } else {
        log.warn("Received data to write, but didn't receive a `onContentInformationReceived` call")
      }
      try fileHandle.write(data: data, atOffset: Int(offset))
      saveMediaInfo()
    } catch {
      log.warn("Failed to write at offset with the file handle")
    }
  }

  func requestData(from: Int64, to: Int64) -> Data? {
    if canRespondWithData(from: from, to: to) {
      return fileHandle.readData(withOffset: Int(from), forLength: Int(to-from) + 1)
    }
    return nil
  }

  func requestBeginningOfData(from: Int64, to: Int64) -> Data? {
    guard let loadedDataRanges = mediaInfo?.loadedDataRanges else {
      return nil
    }
    guard let dataRange = loadedDataRanges.first(where: { (loadedDataRangeStart, loadedDataRangeEnd) in
      from >= loadedDataRangeStart
    }) else {
      return nil
    }

    // TODO:
    if Int(dataRange.1 - Int(from)) + 1 < 3_000_000 {
      return nil
    }
    return fileHandle.readData(withOffset: Int(from), forLength: Int(dataRange.1 - Int(from)) + 1)
  }

  func canRespondWithData(from: Int64, to: Int64) -> Bool {
    guard let loadedDataRanges = mediaInfo?.loadedDataRanges else {
      return false
    }
    return loadedDataRanges.contains(where: { (loadedDataRangeStart, loadedDataRangeEnd) in
      from >= loadedDataRangeStart && to <= loadedDataRangeEnd
    })
  }

  func insertAndMerge(loadedDataRanges: Array<(Int, Int)>, newDataRange: (Int, Int)) -> Array<(Int, Int)>{
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

    return merged
  }

  func maybeLoadMediaInfo() {
    if mediaInfo == nil {
      mediaInfo = readMediaInfo()
    }
  }

  // Saves the mime type of a video fetched from the server into a file. This allows playing videos without an extension in the
  // url.
  private func saveMediaInfo() {
    let mediaInfoPath = dataPath + VideoCacheManager.mediaInfoSuffix

    do {
      if (FileManager.default.fileExists(atPath: mediaInfoPath)) {
        try FileManager.default.removeItem(atPath: mediaInfoPath)
      }

      FileManager.default.createFile(atPath: mediaInfoPath, contents: mediaInfo?.encodeToData())
    } catch {
      log.warn("Failed to save media info at: \(mediaInfoPath)")
    }
  }
  
  private func readMediaInfo() -> MediaInfo? {
    return Self.readMediaInfo(for: self.url)
  }

  private func urlResponseSupportsByteRangeAcces(_ urlResponse: HTTPURLResponse) -> Bool {
    // The first option is the standard-correct one, but we can check for some more in case someone
    // didn't follow the documention fully when implementing the server
    return urlResponse.allHeaderFields["Accept-Ranges"] as? String == "bytes" ||
           urlResponse.allHeaderFields["Accept-Ranges"] as? String == "Bytes" ||
           urlResponse.allHeaderFields["accept-ranges"] as? String == "bytes" ||
           urlResponse.allHeaderFields["accept-ranges"] as? String == "Bytes"
  }

  static func readMediaInfo(for url: URL) -> MediaInfo? {
    guard let filePath = CachingPlayerItem.pathForUrl(url: url, fileExtension: url.pathExtension) else {
      return nil
    }
    let mediaInfoPath = filePath + VideoCacheManager.mediaInfoSuffix
    return MediaInfo(at: mediaInfoPath)
  }
}

