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
