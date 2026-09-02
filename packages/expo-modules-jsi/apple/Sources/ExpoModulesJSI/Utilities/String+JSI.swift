// Copyright 2026-present 650 Industries. All rights reserved.

internal import ExpoModulesJSI_Cxx
import Foundation
internal import jsi

extension String {
  /// Builds a Swift `String` from a `jsi::String` by reading the engine's internal representation
  /// through `getStringData`, without materializing a `std::string` first.
  ///
  /// Hermes stores strings as either ASCII bytes or UTF-16 code units and hands over whichever it
  /// has, chunk by chunk (only rope strings arrive in several chunks). ASCII bytes are valid UTF-8 and
  /// are copied as-is with no validation. UTF-16 is transcoded to UTF-8 on the Swift side, which is
  /// several times cheaper than letting the engine produce UTF-8 through `utf8()` and validating it
  /// again in Swift. Measured against `utf8()`: 12-byte ASCII unchanged, 4 KB ASCII 3.7x faster,
  /// 4 KB non-ASCII 2.4x faster, 12-byte non-ASCII unchanged.
  internal init(jsiString: borrowing facebook.jsi.String, in runtime: facebook.jsi.IRuntime) {
    var result = ""
    withUnsafeMutablePointer(to: &result) { resultPtr in
      runtime.getStringData(jsiString, UnsafeMutableRawPointer(resultPtr)) { ctx, ascii, data, count in
        guard count > 0, let data else {
          // An empty chunk adds nothing to the result. Guarding here also keeps the pointer
          // arithmetic below free of optionals on both paths.
          return
        }
        let out = ctx!.assumingMemoryBound(to: String.self)
        let chunk: String
        if ascii {
          let bytes = UnsafeBufferPointer(start: data.assumingMemoryBound(to: UInt8.self), count: Int(count))
          chunk = String(unsafeUninitializedCapacity: Int(count)) { buffer in
            return buffer.initialize(fromContentsOf: bytes)
          }
        } else {
          let units = UnsafeBufferPointer(start: data.assumingMemoryBound(to: UInt16.self), count: Int(count))
          if count < 512 {
            // Short strings: transcode straight into the string's UTF-8 storage. `String(decoding:as:)`
            // carries a fixed setup cost of a few hundred nanoseconds that dominates below this size.
            // Worst case is 3 UTF-8 bytes per UTF-16 code unit (a surrogate pair is 4 bytes for 2 units).
            chunk = String(unsafeUninitializedCapacity: Int(count) * 3) { buffer in
              var written = 0
              _ = transcode(units.makeIterator(), from: UTF16.self, to: UTF8.self, stoppingOnError: false) { byte in
                buffer[written] = byte
                written += 1
              }
              return written
            }
          } else {
            // Long strings: the standard library's bulk decoder is faster per code unit.
            chunk = String(decoding: units, as: UTF16.self)
          }
        }
        if out.pointee.isEmpty {
          out.pointee = chunk
        } else {
          out.pointee += chunk
        }
      }
    }
    self = result
  }
}
