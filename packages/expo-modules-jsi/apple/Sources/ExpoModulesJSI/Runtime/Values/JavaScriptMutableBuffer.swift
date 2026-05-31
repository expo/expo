// Copyright 2025-present 650 Industries. All rights reserved.

internal import ExpoModulesJSI_Cxx

/// A borrowed native `MutableBuffer` backing a JavaScript `ArrayBuffer`.
///
/// The data pointer and size are captured at borrow time. Resizable or detached
/// ArrayBuffers are not supported by this borrowed representation.
public struct JavaScriptMutableBuffer: ~Copyable, @unchecked Sendable {
  public let data: UnsafeMutablePointer<UInt8>
  public let size: Int

  private let retainer: UnsafeMutableRawPointer

  internal init(data: UnsafeMutablePointer<UInt8>, size: Int, retainer: UnsafeMutableRawPointer) {
    self.data = data
    self.size = size
    self.retainer = retainer
  }

  deinit {
    expo.releaseBorrowedBuffer(retainer)
  }
}
