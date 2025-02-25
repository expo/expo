// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import AVFoundation
import CryptoKit
import MobileCoreServices

internal func getRangeFromResponse(response: HTTPURLResponse) -> (Int?, Int?) {
  // Sometimes the server returns under non-capitalized letters
  let fullString = (response.allHeaderFields["Content-Range"] ?? response.allHeaderFields["content-range"]) as? String
  // Example string: bytes 0-158008373/158008374
  let fullStringComponents = fullString?.components(separatedBy: "/").first?.components(separatedBy: " ")
  guard let rangeStringComponents = fullStringComponents?[safe: 1]?.components(separatedBy: "-") else {
    return (nil, nil)
  }
  let first = rangeStringComponents.first ?? ""
  let second = rangeStringComponents.count > 1 ? rangeStringComponents[1] : ""

  return (Int(first), Int(second))
}

internal func getRangeFromRequest(request: URLRequest) -> (Int?, Int?) {
  guard let fullString = request.allHTTPHeaderFields?["Range"] else {
    return (nil, nil)
  }
  let rangeString = fullString.replacingOccurrences(of: "bytes=", with: "")
  let rangeStringComponents = rangeString.split(separator: "-", maxSplits: 1, omittingEmptySubsequences: false)
  let first = rangeStringComponents.first ?? ""
  let second = rangeStringComponents.count > 1 ? rangeStringComponents[1] : ""

  return (Int(first), Int(second))
}

internal func mimeTypeToExtension(mimeType: String?) -> String? {
  guard let mimeType else {
    return nil
  }

  guard let mimeUTI = UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, mimeType as CFString, nil)?.takeUnretainedValue() else {
    return nil
  }
  return UTTypeCopyPreferredTagWithClass(mimeUTI, kUTTagClassFilenameExtension)?.takeRetainedValue() as? String
}

internal extension Int {
  var MB: Int { return self * 1024 * 1024 }
}

internal extension Array {
  subscript(safe index: Int) -> Element? {
    return indices.contains(index) ? self[index] : nil
  }
}

internal extension Data {
  func subdata(request: URLRequest, response: HTTPURLResponse) -> Data? {
    let (requestStart, requestEnd) = getRangeFromRequest(request: request)
    let (responseStart, responseEnd) = getRangeFromResponse(response: response)

    guard let responseStart, let responseEnd, let requestStart else {
      return nil
    }
    // Error handling checks would actually occur here, similar to Objective-C version
    guard requestStart >= responseStart, requestStart < responseEnd else {
      return nil
    }

    let startIndex = requestStart - responseStart // Corrected start index calculation
    var endIndex: Int // Define endIndex outside of conditional logic

    if let requestEnd = requestEnd {
      endIndex = startIndex + (requestEnd - requestStart) + 1 // Use safely unwrapped requestEnd
    } else {
      // If requestEnd is nil, assume data to the end of resource is needed
      endIndex = self.count
    }

    if endIndex > self.count {
      return nil
    }

    return self.subdata(in: startIndex..<endIndex)
  }
}

internal extension URL {
  func withScheme(_ scheme: String) -> URL? {
    var components = URLComponents(url: self, resolvingAgainstBaseURL: false)
    components?.scheme = scheme
    return components?.url
  }
}
