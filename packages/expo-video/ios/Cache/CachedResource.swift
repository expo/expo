// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import AVFoundation
import ExpoModulesCore

/**
 * Class used to manage a single cached resource.  Stores a fileHandle to saved video data, and
 * allows saving/loading data used to correctly decode the data.
 */
class CachedResource {
  private let url: URL
  private let dataPath: String
  private let fileHandle: MediaFileHandle
  private(set) var mediaInfo: MediaInfo?

  init(dataFileUrl: String, resourceUrl: URL, dataPath: String) {
    self.dataPath = dataPath
    self.url = resourceUrl
    self.fileHandle = MediaFileHandle(filePath: dataFileUrl)
    self.mediaInfo = MediaInfo(forResourceUrl: resourceUrl)
  }

  func onResponseReceived(response: HTTPURLResponse) {
    guard let headers = response.allHeaderFields as? [String: String], mediaInfo == nil, response.statusCode == 200 else {
      return
    }

    mediaInfo = MediaInfo(
      expectedContentLength: response.expectedContentLength,
      mimeType: response.mimeType,
      supportsByteRangeAccess: urlResponseSupportsByteRangeAcces(response),
      headerFields: headers,
      savePath: dataPath + VideoCacheManager.mediaInfoSuffix
    )
    mediaInfo?.saveToFile()
  }

  func fill(forLoadingRequest request: AVAssetResourceLoadingRequest) {
    guard let mediaInfo, let mimeType = mediaInfo.mimeType else {
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

  func writeData(data: Data, offset: Int64) async {
    do {
      mediaInfo?.addDataRange(newDataRange: (Int(offset), Int(offset) + data.count))
      mediaInfo?.saveToFile()
      try fileHandle.write(data: data, atOffset: Int(offset))
    } catch {
      log.warn("Failed to write at offset with the file handle")
    }
  }

  func requestData(from: Int64, to: Int64) -> Data? {
    if canRespondWithData(from: from, to: to) {
      return fileHandle.readData(withOffset: Int(from), forLength: Int(to - from) + 1)
    }
    return nil
  }

  func requestBeginningOfData(from: Int64, to: Int64) -> Data? {
    guard let dataRange = mediaInfo?.loadedDataRanges.first(where: { dataStart, dataEnd in
      from >= dataStart && from < dataEnd
    }) else {
      return nil
    }

    return fileHandle.readData(withOffset: Int(from), forLength: Int(dataRange.1 - Int(from)) + 1)
  }

  func canRespondWithData(from: Int64, to: Int64) -> Bool {
    guard let loadedDataRanges = mediaInfo?.loadedDataRanges else {
      return false
    }
    return loadedDataRanges.contains(where: { loadedDataRangeStart, loadedDataRangeEnd in
      from >= loadedDataRangeStart && to <= loadedDataRangeEnd
    })
  }

  private func urlResponseSupportsByteRangeAcces(_ urlResponse: HTTPURLResponse) -> Bool {
    // The first option is the standard-correct one, but we can check for some more in case someone
    // didn't follow the documention fully when implementing the server
    return urlResponse.allHeaderFields["Accept-Ranges"] as? String == "bytes" ||
      urlResponse.allHeaderFields["Accept-Ranges"] as? String == "Bytes" ||
      urlResponse.allHeaderFields["accept-ranges"] as? String == "bytes" ||
      urlResponse.allHeaderFields["accept-ranges"] as? String == "Bytes"
  }
}
