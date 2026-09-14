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
      // Goes through the `expo.getStringData` wrapper rather than the runtime method: on RN older
      // than 0.86 (e.g. react-native-macos 0.81) `Runtime::getStringData` is protected, so Swift
      // cannot call it directly.
      expo.getStringData(runtime, jsiString, UnsafeMutableRawPointer(resultPtr), appendEngineStringChunk)
    }
    self = result
  }

  /// Builds a `jsi::PropNameID` from the string's UTF-8 bytes. This is how every String-keyed
  /// property API turns its name into a key: JSI's `const char*` overloads treat the bytes as ASCII
  /// and would mangle any non-ASCII name.
  internal func toJSIPropNameID(in runtime: facebook.jsi.IRuntime) -> facebook.jsi.PropNameID {
    // The `(pointer, length)` overload needs the UTF-8 *byte* count, which `withUTF8` provides
    // exactly; `String.count` would be wrong here because it counts grapheme clusters (e.g. `"café"`
    // reports 4 for 5 UTF-8 bytes). `withUTF8` is mutating (it makes a bridged string contiguous
    // first), hence the local copy, and the result leaves the closure through an optional because
    // it has to be a `Copyable` type.
    var string = self
    var propNameID: facebook.jsi.PropNameID? = nil
    string.withUTF8 { utf8 in
      guard let base = utf8.baseAddress else {
        propNameID = facebook.jsi.PropNameID.forAscii(runtime, "", 0)
        return
      }
      propNameID = facebook.jsi.PropNameID.forUtf8(runtime, base, utf8.count)
    }
    return propNameID.take()!
  }
}

/// Callback for `getStringData`. `ctx` points at the Swift `String` being built; each call appends
/// one chunk of the engine's internal representation to it.
private func appendEngineStringChunk(ctx: UnsafeMutableRawPointer?, ascii: Bool, data: UnsafeRawPointer?, count: Int) {
  guard count > 0, let data else {
    // An empty chunk adds nothing to the result. Guarding here also keeps the pointer
    // arithmetic below free of optionals on both paths.
    return
  }
  let out = ctx!.assumingMemoryBound(to: String.self)
  let chunk: String
  if ascii {
    let bytes = UnsafeBufferPointer(start: data.assumingMemoryBound(to: UInt8.self), count: count)
    chunk = String(unsafeUninitializedCapacity: count) { buffer in
      return buffer.initialize(fromContentsOf: bytes)
    }
  } else {
    let units = UnsafeBufferPointer(start: data.assumingMemoryBound(to: UInt16.self), count: count)
    if count < 512 {
      // Short strings: transcode straight into the string's UTF-8 storage, sized for the worst case
      // of 3 UTF-8 bytes per UTF-16 code unit (a surrogate pair is 4 bytes for 2 units). This is
      // 1.5-1.6x faster than `String(decoding:as:)` up to a few hundred code units, which carries a
      // fixed setup cost of a few hundred nanoseconds.
      chunk = String(unsafeUninitializedCapacity: count * 3) { buffer in
        return transcodeUTF16(units, into: buffer)
      }
    } else {
      // Long strings: the loop and the standard library's bulk decoder run at the same speed here,
      // but the bulk decoder sizes the storage exactly, while the string above keeps its 3x worst-case
      // capacity. That matters once strings are kilobytes rather than bytes.
      chunk = String(decoding: units, as: UTF16.self)
    }
  }
  if out.pointee.isEmpty {
    out.pointee = chunk
  } else {
    out.pointee += chunk
  }
}

/// Writes the UTF-8 encoding of `units` into `buffer` and returns the number of bytes written.
/// Unpaired surrogates become U+FFFD, one per code unit, which is what `String(decoding:as:)` and
/// `transcode(stoppingOnError: false)` produce. It replaces the standard library's `transcode`, which
/// calls back once per output byte; this loop writes each scalar's bytes directly.
/// `buffer` must hold at least 3 bytes per code unit.
private func transcodeUTF16(
  _ units: UnsafeBufferPointer<UInt16>,
  into buffer: UnsafeMutableBufferPointer<UInt8>
) -> Int {
  var index = 0
  var written = 0
  while index < units.count {
    let unit = UInt32(units[index])
    index += 1
    let scalar: UInt32
    if unit < 0xD800 || unit > 0xDFFF {
      scalar = unit
    } else if unit < 0xDC00, index < units.count, (0xDC00...0xDFFF).contains(units[index]) {
      scalar = 0x10000 + ((unit - 0xD800) << 10) + (UInt32(units[index]) - 0xDC00)
      index += 1
    } else {
      scalar = 0xFFFD
    }
    if scalar < 0x80 {
      buffer[written] = UInt8(scalar)
      written += 1
    } else if scalar < 0x800 {
      buffer[written] = UInt8(0xC0 | (scalar >> 6))
      buffer[written + 1] = UInt8(0x80 | (scalar & 0x3F))
      written += 2
    } else if scalar < 0x10000 {
      buffer[written] = UInt8(0xE0 | (scalar >> 12))
      buffer[written + 1] = UInt8(0x80 | ((scalar >> 6) & 0x3F))
      buffer[written + 2] = UInt8(0x80 | (scalar & 0x3F))
      written += 3
    } else {
      buffer[written] = UInt8(0xF0 | (scalar >> 18))
      buffer[written + 1] = UInt8(0x80 | ((scalar >> 12) & 0x3F))
      buffer[written + 2] = UInt8(0x80 | ((scalar >> 6) & 0x3F))
      buffer[written + 3] = UInt8(0x80 | (scalar & 0x3F))
      written += 4
    }
  }
  return written
}
