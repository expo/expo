// Copyright 2015-present 650 Industries. All rights reserved.

/**
 A data structure to store response body chunks
 */
internal final class ResponseSink {
  private var bodyQueue: [Data] = []
  private var isFinalized = false
  private(set) var bodyUsed = false

  func appendBufferBody(data: Data) {
    bodyUsed = true
    bodyQueue.append(data)
  }

  func finalize() -> Data {
    let size = bodyQueue.reduce(0) { $0 + $1.count }
    var result = Data(capacity: size)
    while !bodyQueue.isEmpty {
      let data = bodyQueue.removeFirst()
      result.append(data)
    }
    bodyUsed = true
    isFinalized = true
    return result
  }
}
