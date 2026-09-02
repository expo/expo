// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesJSI

@available(*, deprecated, renamed: "ArrayBuffer", message: "Use ArrayBuffer instead.")
public typealias NativeArrayBuffer = ArrayBuffer

/**
 An exception thrown when `baseAddress` of `UnsafeMutableRawBufferPointer` is `nil`.
 */
public final class MissingBaseAddressError: Exception, @unchecked Sendable {
  override public var reason: String {
    "Cannot get baseAddress of given data"
  }
}
