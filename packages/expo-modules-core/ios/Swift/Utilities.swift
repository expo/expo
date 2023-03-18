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

// MARK: - URLs

/**
 A string with non-alphanumeric url-safe characters according to RFC 3986.
 These characters might have to be explicitly percent-encoded when used in URL components other than intended.
 */
internal let urlAllowedCharacters = "-._~:/?#[]@!$&'()*+,;="

/**
 A `CharacterSet` instance containing all alphanumerics and characters allowed in at least one part of a URL.
 */
internal let urlAllowedCharactersSet = CharacterSet.alphanumerics.union(CharacterSet(charactersIn: urlAllowedCharacters))

/**
 Returns the given string with percent-encoded characters that are not allowed in any of the URL components as defined by RFC 3986.
 This is useful for auto-encoding unicode characters.
 */
internal func percentEncodeUrlString(_ url: String) -> String? {
  let encodedString = url.addingPercentEncoding(withAllowedCharacters: urlAllowedCharactersSet)
  return encodedString?.replacingOccurrences(of: "%25", with: "%")
}

/**
 Checks whether the given string is a file URL path (URL string without the scheme).
 */
internal func isFileUrlPath(_ path: String) -> Bool {
  guard let encodedPath = path.addingPercentEncoding(withAllowedCharacters: urlAllowedCharactersSet) else {
    return false
  }
  return URL(string: encodedPath)?.scheme == nil
}
