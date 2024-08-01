// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/**
 `URLRequest.httpBodyData()` extension to read the underlying `httpBodyStream` as Data.
 */
extension URLRequest {
  func httpBodyData(limit: Int = ExpoRequestInterceptorProtocol.MAX_BODY_SIZE) -> Data? {
    if let httpBody = self.httpBody {
      return httpBody
    }

    if let contentLength = self.allHTTPHeaderFields?["Content-Length"],
      let contentLengthInt = Int(contentLength),
      contentLengthInt > limit {
      return nil
    }
    guard let stream = self.httpBodyStream else {
      return nil
    }

    let bufferSize: Int = 8192
    let buffer = UnsafeMutablePointer<UInt8>.allocate(capacity: bufferSize)

    stream.open()
    defer {
      buffer.deallocate()
      stream.close()
    }

    var data = Data()
    while stream.hasBytesAvailable {
      let chunkSize = stream.read(buffer, maxLength: bufferSize)
      if data.count + chunkSize > limit {
        return nil
      }
      data.append(buffer, count: chunkSize)
    }

    return data
  }
}
