//  Copyright © 2019 650 Industries. All rights reserved.

import Foundation

public typealias MultipartCallback = (_ headers: [String: Any]?, _ content: Data?, _ done: Bool) -> Void

/**
 * Fork of React Native's RCTMultipartStreamReader that doesn't necessarily
 * expect a preamble (first boundary is not necessarily preceded by CRLF).
 */
public final class UpdatesMultipartStreamReader {
  private enum Constants {
    static let crlf = "\r\n"
    static let bufferLength = 4 * 1024
  }

  private let stream: InputStream
  private let boundary: String

  public init(inputStream: InputStream, boundary: String) {
    self.stream = inputStream
    self.boundary = boundary
  }

  public func readAllParts(withCompletionCallback callback: @escaping MultipartCallback) -> Bool {
    var chunkStart = 0
    var bytesSeen = 0

    // First delimiter doesn't necessarily need to be preceded by CRLF (boundary can be first thing in body)
    let firstDelimiter = Data("--\(boundary)\(Constants.crlf)".utf8)
    let restDelimiter = Data("\(Constants.crlf)--\(boundary)\(Constants.crlf)".utf8)
    let closeDelimiter = Data("\(Constants.crlf)--\(boundary)--\(Constants.crlf)".utf8)

    var delimiter = firstDelimiter
    var content = Data()
    var currentHeaders: [String: Any]?

    var buffer = [UInt8](repeating: 0, count: Constants.bufferLength)

    stream.open()
    defer { stream.close() }

    while true {
      var isCloseDelimiter = false

      // Search only a subset of chunk that we haven't seen before + few bytes
      // to allow for the edge case when the delimiter is cut by read call
      let searchStart = max(bytesSeen - closeDelimiter.count, chunkStart)
      let remainingBufferRange = NSRange(location: searchStart, length: content.count - searchStart)

      // Check for delimiters
      var range = content.range(of: delimiter, options: [], in: remainingBufferRange)
      if range.location == NSNotFound {
        isCloseDelimiter = true
        range = content.range(of: closeDelimiter, options: [], in: remainingBufferRange)
      }

      if range.location == NSNotFound {
        if currentHeaders == nil {
          if let newHeaders = parseHeadersIfFound(in: content, range: remainingBufferRange, chunkStart: chunkStart) {
            currentHeaders = newHeaders
          }
        }

        bytesSeen = content.count
        let bytesRead = buffer.withUnsafeMutableBytes { bytes in
          guard let baseAddress = bytes.bindMemory(to: UInt8.self).baseAddress else {
            return 0
          }
          return stream.read(baseAddress, maxLength: Constants.bufferLength)
        }
        guard bytesRead > 0, stream.streamError == nil else {
          return false
        }
        content.append(contentsOf: buffer.prefix(bytesRead))
        continue
      }

      let chunkEnd = range.location
      let length = chunkEnd - chunkStart
      bytesSeen = chunkEnd

      // Ignore preamble
      if chunkStart > 0 {
        let startIndex = content.index(content.startIndex, offsetBy: chunkStart)
        let endIndex = content.index(startIndex, offsetBy: length)
        let chunk = Data(content[startIndex..<endIndex])
        emitChunk(chunk, headers: currentHeaders, callback: callback, done: isCloseDelimiter)
        currentHeaders = nil
      }

      if isCloseDelimiter {
        return true
      }

      chunkStart = chunkEnd + delimiter.count

      if delimiter == firstDelimiter {
        delimiter = restDelimiter
      }
    }
  }

  private func parseHeadersIfFound(
    in content: Data,
    range: NSRange,
    chunkStart: Int
  ) -> [String: Any]? {
    let marker = Data("\(Constants.crlf)\(Constants.crlf)".utf8)
    let range = content.range(of: marker, options: [], in: range)
    guard range.location != NSNotFound else {
      return nil
    }

    let startIndex = content.index(content.startIndex, offsetBy: chunkStart)
    let endIndex = content.index(content.startIndex, offsetBy: range.location)
    let data = content[startIndex..<endIndex]
    return parseHeaders(Data(data))
  }

  private func parseHeaders(_ data: Data) -> [String: Any] {
    guard let text = String(data: data, encoding: .utf8) else {
      return [:]
    }

    return text.components(separatedBy: Constants.crlf)
      .compactMap { line -> (String, String)? in
        guard let colonRange = line.range(of: ":") else {
          return nil
        }
        let key = String(line[..<colonRange.lowerBound])
        let value = String(line[colonRange.upperBound...])
          .trimmingCharacters(in: .whitespacesAndNewlines)
        return (key, value)
      }
      .reduce(into: [String: Any]()) { headers, valueTuple in
        headers[valueTuple.0] = valueTuple.1
      }
  }

  private func emitChunk(
    _ data: Data,
    headers: [String: Any]?,
    callback: @escaping MultipartCallback,
    done: Bool
  ) {
    let marker = Data("\(Constants.crlf)\(Constants.crlf)".utf8)
    guard let range = data.range(of: marker) else {
      callback(nil, data, done)
      return
    }

    let bodyData = data.subdata(in: range.upperBound..<data.endIndex)

    if let headers {
      callback(headers, bodyData, done)
      return
    }

    let headersData = data.subdata(in: data.startIndex..<range.lowerBound)
    callback(parseHeaders(headersData), bodyData, done)
  }
}

private extension Data {
  func range(of data: Data, options: Data.SearchOptions = [], in range: NSRange) -> NSRange {
    return (self as NSData).range(of: data, options: options, in: range)
  }
}
