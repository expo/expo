// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Executes the given Swift closure and if it throws, the `NSError` is set on the given `NSErrorPointer` and the original error is rethrown.
 This is especially useful for ObjC<->Swift interop, specifically when the ObjC needs to catch errors thrown by Swift closure.
 */
internal func runWithErrorPointer<R>(_ errorPointer: NSErrorPointer, _ closure: () throws -> R) rethrows -> R? {
  do {
    return try closure()
  } catch {
    errorPointer?.pointee = toNSError(error)
    throw error
  }
}

/**
 Converts Swift errors to `NSError` so that they can be handled from the ObjC code.
 */
internal func toNSError(_ error: Error) -> NSError {
  if let error = error as? Exception {
    return NSError(domain: "dev.expo.modules", code: 0, userInfo: [
      "name": error.name,
      "code": error.code,
      "message": error.debugDescription,
    ])
  }
  return error as NSError
}

/**
 Makes sure the url string is percent encoded. If the given string is already encoded, it's decoded first.
 Note that it encodes only characters that are not allowed in the url query and '#' that indicates the fragment part.
 */
internal func percentEncodeUrlString(_ url: String) -> String? {
  // URL contains '#' so it has a fragment part.
  // We know that because that is the only allowed use case of the undecoded '#' symbol inside of the URL.
  if url.contains("#") {
    let urlParts = url.split(separator: "#")

    // Encodes the url without the fragment part. It'll leave the fragment part untounched.
    guard let parsed = percentEncodeUrlStringWithoutFragment(String(urlParts[0])) else {
      return nil
    }

    // Concatenate encoded path with fragment.
    return parsed + "#" + urlParts[1]
  }

  return percentEncodeUrlStringWithoutFragment(url)
}

private func percentEncodeUrlStringWithoutFragment(_ url: String) -> String? {
  // The value may come unencoded or already encoded, so first we try to decode it.
  // `removingPercentEncoding` returns nil when the string contains an invalid percent-encoded sequence,
  // but that usually means the value came unencoded, so it falls back to the given string.
  let decodedString = url.removingPercentEncoding ?? url

  // Do the percent encoding, but note that it may still return nil when it's not possible to encode for some reason.
  return decodedString.addingPercentEncoding(withAllowedCharacters: CharacterSet.urlQueryAllowed)
}
