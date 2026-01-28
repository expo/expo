// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import AVFoundation
import ExpoModulesCore

/**
 * Actor to serialize write operations to file and metadata
 */
private actor WriteCoordinator {
  func performWrite(
    data: Data,
    offset: Int64,
    fileHandle: MediaFileHandle,
    mediaInfo: MediaInfo?
  ) throws {
    try fileHandle.write(data: data, atOffset: offset)

    let endOffset = offset + Int64(data.count)

    mediaInfo?.addDataRange(newDataRange: (offset, endOffset))
    mediaInfo?.saveToFile()
  }
}

/**
 * Class used to manage a single cached resource.  Stores a fileHandle to saved video data, and
 * allows saving/loading data used to correctly decode the data.
 */
class CachedResource {
  private let url: URL
  private let dataPath: String
  private let fileHandle: MediaFileHandle
  private(set) var mediaInfo: MediaInfo?

  private let writeCoordinator = WriteCoordinator()

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
    guard !data.isEmpty else {
      log.warn("[expo-video] Attempted to write empty data at offset \(offset), skipping")
      return
    }

    guard offset >= 0 else {
      log.error("Invalid negative offset: \(offset)")
      return
    }

    do {
      try await writeCoordinator.performWrite(
        data: data,
        offset: offset,
        fileHandle: fileHandle,
        mediaInfo: mediaInfo
      )
    } catch {
      log.warn("[expo-video] Failed to write at offset \(offset) with the file handle: \(error)")
    }
  }

  // Returns data for the requested range if fully cached
  // Expects 'from' and 'to' as inclusive byte positions
  func requestData(from: Int64, to: Int64) -> Data? {
    guard from <= to else {
      log.error("Invalid range: from=\(from) > to=\(to)")
      return nil
    }

    if canRespondWithData(from: from, to: to) {
      let length64 = to - from + 1

      guard length64 >= 0 && length64 <= Int.max else {
        log.error("Requested range length \(length64) exceeds Int.max")
        return nil
      }

      let length = Int(length64)
      return fileHandle.readData(withOffset: from, forLength: length)
    }
    return nil
  }

  // Returns partial data from the beginning of the first cached range that contains 'from'
  // Returns data up to the end of that cached range (may be less than requested)
  func requestBeginningOfData(from: Int64, to: Int64) -> Data? {
    guard let dataRange = mediaInfo?.loadedDataRanges.first(where: { dataStart, dataEnd in
      from >= dataStart && from < dataEnd
    }) else {
      return nil
    }

    // Calculate available length from 'from' to the end of this cached range (exclusive)
    let availableLength = dataRange.1 - from
    guard availableLength > 0 else {
      return nil
    }

    // Validate length fits in Int
    guard availableLength <= Int.max else {
      log.error("Available length \(availableLength) exceeds Int.max")
      return nil
    }

    return fileHandle.readData(withOffset: from, forLength: Int(availableLength))
  }

  // Checks if the requested range [from, to] is fully contained in cached data
  // 'from' and 'to' are inclusive byte positions
  // Stored ranges are half-open [start, end), so we check if (to + 1) <= end
  func canRespondWithData(from: Int64, to: Int64) -> Bool {
    guard let loadedDataRanges = mediaInfo?.loadedDataRanges else {
      return false
    }
    let exclusiveEnd = to + 1
    return loadedDataRanges.contains(where: { loadedDataRangeStart, loadedDataRangeEnd in
      from >= loadedDataRangeStart && exclusiveEnd <= loadedDataRangeEnd
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
