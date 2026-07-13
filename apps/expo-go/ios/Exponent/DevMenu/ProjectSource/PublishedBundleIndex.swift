// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/// Index of a plain-JS Metro bundle: each `__d(...)` module's dependency ids
/// and source file (via the inline sourcemap). Built once per bundle, off the
/// main actor.
struct PublishedBundleIndex: Sendable {
  struct Module: Sendable {
    let id: Int
    let dependencyIds: [Int]
  }

  let modules: [Int: Module]
  /// Keyed by the same display paths SourceTree uses, so explorer paths can
  /// be looked up directly.
  let moduleIdByDisplayPath: [String: Int]
  /// Raw sourcemap path per module id (what the transformer wants as the
  /// filename).
  let sourcePathByModuleId: [Int: String]

  enum BuildError: Error {
    case noModulesFound
  }

  /// Modules start at a line beginning `__d(` and end with `,<id>,[<deps>]);`
  /// - a module can span multiple lines (template literals), so chunks run
  /// from one `__d(` line start to the next.
  static func build(bundle: Data, map: SourceMapDTO) throws -> PublishedBundleIndex {
    let bytes = [UInt8](bundle)
    let starts = moduleStartOffsets(in: bytes)
    guard !starts.isEmpty else {
      throw BuildError.noModulesFound
    }

    let sourceIndexByLine = firstSourceIndexPerLine(mappings: map.mappings)

    var modules: [Int: Module] = [:]
    var moduleIdByDisplayPath: [String: Int] = [:]
    var sourcePathByModuleId: [Int: String] = [:]

    for (index, start) in starts.enumerated() {
      let chunkEnd = index + 1 < starts.count ? starts[index + 1].offset - 1 : bytes.count
      guard let tail = parseModuleTail(bytes: bytes, chunkStart: start.offset, chunkEnd: chunkEnd) else {
        continue
      }

      modules[tail.id] = Module(
        id: tail.id,
        dependencyIds: tail.deps
      )

      if let sourceIndex = sourceIndexByLine[start.line], sourceIndex < map.sources.count {
        let sourcePath = map.sources[sourceIndex]
        sourcePathByModuleId[tail.id] = sourcePath
        if let components = SourceTreeBuilder.displayComponents(forSourcePath: sourcePath) {
          moduleIdByDisplayPath[components.joined(separator: "/")] = tail.id
        }
      }
    }

    return PublishedBundleIndex(
      modules: modules,
      moduleIdByDisplayPath: moduleIdByDisplayPath,
      sourcePathByModuleId: sourcePathByModuleId
    )
  }

  // MARK: - bundle scanning

  private static func moduleStartOffsets(in bytes: [UInt8]) -> [(offset: Int, line: Int)] {
    // "__d(" at the start of a line
    let prefix: [UInt8] = [0x5f, 0x5f, 0x64, 0x28]
    var result: [(offset: Int, line: Int)] = []
    var line = 1
    var atLineStart = true
    var i = 0
    while i < bytes.count {
      if atLineStart, i + 4 <= bytes.count,
         bytes[i] == prefix[0], bytes[i + 1] == prefix[1], bytes[i + 2] == prefix[2], bytes[i + 3] == prefix[3] {
        result.append((offset: i, line: line))
      }
      atLineStart = bytes[i] == 0x0a
      if atLineStart {
        line += 1
      }
      i += 1
    }
    return result
  }

  /// Parses `},<id>,[<deps>]);` backwards from the end of a module chunk.
  /// Trailing lines that aren't part of the module (`__r(...)` bootstrap
  /// calls, the sourcemap comment) are skipped by scanning line ends upwards
  /// until one parses.
  private static func parseModuleTail(
    bytes: [UInt8], chunkStart: Int, chunkEnd: Int
  ) -> (id: Int, deps: [Int])? {
    var lineEnd = chunkEnd
    while lineEnd > chunkStart {
      // position after the last non-newline byte of this line
      while lineEnd > chunkStart && bytes[lineEnd - 1] == 0x0a {
        lineEnd -= 1
      }
      if let parsed = parseTail(bytes: bytes, endingAt: lineEnd, notBefore: chunkStart) {
        return parsed
      }
      // move to the end of the previous line
      while lineEnd > chunkStart && bytes[lineEnd - 1] != 0x0a {
        lineEnd -= 1
      }
    }
    return nil
  }

  private static func parseTail(
    bytes: [UInt8], endingAt end: Int, notBefore floor: Int
  ) -> (id: Int, deps: [Int])? {
    var i = end
    func prev() -> UInt8? { i > floor ? bytes[i - 1] : nil }

    if prev() == UInt8(ascii: ";") { i -= 1 }
    guard prev() == UInt8(ascii: ")") else { return nil }
    i -= 1
    guard prev() == UInt8(ascii: "]") else { return nil }
    i -= 1

    var deps: [Int] = []
    var current = 0
    var scale = 1
    var sawDigit = false
    loop: while let byte = prev() {
      switch byte {
      case UInt8(ascii: "0")...UInt8(ascii: "9"):
        current += Int(byte - UInt8(ascii: "0")) * scale
        scale *= 10
        sawDigit = true
        i -= 1
      case UInt8(ascii: ","):
        guard sawDigit else { return nil }
        deps.append(current)
        current = 0
        scale = 1
        sawDigit = false
        i -= 1
      case UInt8(ascii: "["):
        if sawDigit { deps.append(current) }
        i -= 1
        break loop
      default:
        return nil
      }
    }
    deps.reverse()

    guard prev() == UInt8(ascii: ",") else { return nil }
    i -= 1

    var id = 0
    scale = 1
    sawDigit = false
    while let byte = prev(), byte >= UInt8(ascii: "0"), byte <= UInt8(ascii: "9") {
      id += Int(byte - UInt8(ascii: "0")) * scale
      scale *= 10
      sawDigit = true
      i -= 1
    }
    guard sawDigit, prev() == UInt8(ascii: ","), i - 1 > floor, bytes[i - 2] == UInt8(ascii: "}") else {
      return nil
    }

    return (id: id, deps: deps)
  }

  // MARK: - sourcemap mappings

  /// First segment's source index for each generated line (1-based). Only the
  /// source-index field accumulates across the whole mappings string; other
  /// fields are decoded and discarded.
  private static func firstSourceIndexPerLine(mappings: String) -> [Int: Int] {
    var result: [Int: Int] = [:]
    var sourceIndex = 0
    var line = 1

    var fields: [Int] = []
    var value = 0
    var shift = 0
    var tookFirstSegmentOfLine = false

    func endSegment() {
      if fields.count >= 4 {
        sourceIndex += fields[1]
        if !tookFirstSegmentOfLine {
          result[line] = sourceIndex
          tookFirstSegmentOfLine = true
        }
      }
      fields.removeAll(keepingCapacity: true)
    }

    for byte in mappings.utf8 {
      switch byte {
      case UInt8(ascii: ";"):
        endSegment()
        line += 1
        tookFirstSegmentOfLine = false
      case UInt8(ascii: ","):
        endSegment()
      default:
        guard let digit = base64Value(byte) else { continue }
        value |= (digit & 31) << shift
        if digit & 32 != 0 {
          shift += 5
        } else {
          fields.append(value & 1 != 0 ? -(value >> 1) : value >> 1)
          value = 0
          shift = 0
        }
      }
    }
    endSegment()

    return result
  }

  private static func base64Value(_ byte: UInt8) -> Int? {
    switch byte {
    case UInt8(ascii: "A")...UInt8(ascii: "Z"): return Int(byte - UInt8(ascii: "A"))
    case UInt8(ascii: "a")...UInt8(ascii: "z"): return Int(byte - UInt8(ascii: "a")) + 26
    case UInt8(ascii: "0")...UInt8(ascii: "9"): return Int(byte - UInt8(ascii: "0")) + 52
    case UInt8(ascii: "+"): return 62
    case UInt8(ascii: "/"): return 63
    default: return nil
    }
  }
}
