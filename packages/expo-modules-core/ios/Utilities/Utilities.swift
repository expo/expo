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
      "message": error.debugDescription
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

internal func convertToUrl(string value: String) -> URL? {
  let url: URL?
  if #available(iOS 17, *) {
    // URL(string:) supports RFC 3986 as URLComponents from iOS 17
    url = URL(string: value)
  } else if #available(iOS 16, *) {
    // URLComponents parses and constructs URLs according to RFC 3986.
    // For some unusual urls URL(string:) will fail incorrectly
    url = URLComponents(string: value)?.url ?? URL(string: value)
  } else {
    // URLComponents on iOS 15 and lower does not well support RFC 3986.
    // We have to fallback URL(fileURLWithPath:) first.
    url = value.hasPrefix("/")
      ? URL(fileURLWithPath: value)
      : URLComponents(string: value)?.url ?? URL(string: value)
  }

  guard let url else {
    return nil
  }
  // If it has no scheme, we assume it was the file path which needs to be recreated to be recognized as the file url.
  return url.scheme != nil ? url : URL(fileURLWithPath: value)
}

/**
 Helper class that lets us bypass the compiler's data-race protection checks by taking the value out of isolation.
 - TODO: Remove it once the code is refactored to deal better with the concurrency model.
 */
internal class NonisolatedUnsafeVar<VarType>: @unchecked Sendable {
  nonisolated(unsafe) var value: VarType

  init(_ value: VarType) {
    self.value = value
  }
}

internal func performSynchronouslyOnMainActor<Result: Sendable>(_ closure: @MainActor () throws -> Result) rethrows -> Result {
  if Thread.isMainThread {
    return try MainActor.assumeIsolated(closure)
  }
  return try DispatchQueue.main.sync(execute: closure)
}

/**
 A collection of utility functions for various Expo Modules common tasks.
 */
public struct Utilities {
  /**
   Converts a `String` to a `URL`.
   */
  public static func urlFrom(string: String) -> URL? {
    return convertToUrl(string: string)
  }

  nonisolated public func currentViewController() -> UIViewController? {
    return MainActor.assumeIsolated {
#if os(iOS) || os(tvOS)
      var controller = UIApplication.shared.keyWindow?.rootViewController

      while let presentedController = controller?.presentedViewController, !presentedController.isBeingDismissed {
        controller = presentedController
      }
      return controller
#elseif os(macOS)
      // Even though the function's return type is `UIViewController`, react-native-macos will alias `NSViewController` to `UIViewController`.
      return NSApplication.shared.keyWindow?.contentViewController
#endif
    }
  }
}
