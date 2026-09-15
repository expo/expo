// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation
import MachO

/// On-device symbolication of MetricKit `CallStackTree` frames using `dladdr`.
///
/// Limitations:
/// - Only resolves frames from binaries currently loaded in this process. System frames
///   from a previous launch may not be loaded here, in which case we leave them as-is.
/// - Swift symbols are demangled via `swift_demangle` (libswiftCore); Itanium-ABI C++
///   symbols are demangled via `__cxa_demangle` (libc++abi). Other forms (Obj-C
///   selectors, plain C) are returned unchanged.
/// - No source file / line number resolution — those require the dSYM and are not on device.
/// - Inlined call chains are not recovered for the same reason.
///
/// The address arithmetic:
///
/// MetricKit gives us the absolute address as it was at crash time, plus the offset of that
/// address into the binary's `__TEXT` segment (`offsetIntoBinaryTextSegment`). The address
/// we need to feed `dladdr` is the *current process's* address for the same instruction:
///
///   currentAddress = currentLoadAddress(binaryName) + offsetIntoBinaryTextSegment
///
/// Where `currentLoadAddress` is the slide-adjusted address of the binary's first segment
/// (typically `__TEXT`) in this process. We grab it from the dyld image table.
enum CrashReportSymbolicator {
  /// How far past a symbol's start a frame can land and still be attributed to it.
  ///
  /// `dladdr` tells us the nearest symbol at or below an address, but not how far away it was, so
  /// this is all we have to go on. It's big enough to cover almost every gap between the symbols
  /// our release builds keep, and far smaller than the gaps that produced wrong names.
  private static let maxSymbolMatchDistance: UInt64 = 8 * 1024

  /// Annotates each frame in the tree with its resolved symbol, when one is available.
  static func symbolicate(_ tree: CrashReport.CallStackTree) -> CrashReport.CallStackTree {
    // Threads in a crash tree share many leaf frames (RunLoop guts, pthread entry points,
    // Hermes interpreter trampolines). Memoizing the mangled→demangled mapping for the
    // duration of one tree avoids redundant `__cxa_demangle` / `swift_demangle` calls,
    // which dominate the per-frame cost on heavily-templated C++ symbols.
    var demangleCache: [String: String] = [:]
    let callStacks = tree.callStacks?.map { stack in
      CrashReport.CallStackTree.CallStack(
        threadAttributed: stack.threadAttributed,
        callStackRootFrames: stack.callStackRootFrames?.map { symbolicateFrame($0, cache: &demangleCache) }
      )
    }
    return CrashReport.CallStackTree(callStacks: callStacks)
  }

  private static func symbolicateFrame(
    _ frame: CrashReport.CallStackTree.Frame,
    cache: inout [String: String]
  ) -> CrashReport.CallStackTree.Frame {
    // We resolve very little of a stripped binary, so keep whatever MetricKit gave us instead.
    // Even its `<redacted>` marker says more than an empty field.
    let symbol = resolveSymbol(for: frame, cache: &cache) ?? frame.symbol
    let subFrames = frame.subFrames?.map { symbolicateFrame($0, cache: &cache) }
    return CrashReport.CallStackTree.Frame(
      binaryName: frame.binaryName,
      binaryUUID: frame.binaryUUID,
      address: frame.address,
      offsetIntoBinaryTextSegment: frame.offsetIntoBinaryTextSegment,
      sampleCount: frame.sampleCount,
      subFrames: subFrames,
      symbol: symbol
    )
  }

  private static func resolveSymbol(
    for frame: CrashReport.CallStackTree.Frame,
    cache: inout [String: String]
  ) -> String? {
    guard let binaryName = frame.binaryName,
      let offset = frame.offsetIntoBinaryTextSegment,
      let loadAddress = loadedImages[binaryName]
    else {
      return nil
    }
    let currentAddress = loadAddress + offset
    var info = Dl_info()
    guard dladdr(UnsafeRawPointer(bitPattern: UInt(currentAddress)), &info) != 0,
      let symbolPtr = info.dli_sname
    else {
      return nil
    }
    // A stripped binary can leave gaps megabytes wide between the symbols it keeps, and `dladdr`
    // will happily name a frame after whichever one happens to precede it. Nothing marks that as a
    // guess, so it sends you looking at code that never ran. Better to admit we don't know and let
    // the caller fall back to `binaryName + offset`.
    guard let symbolStart = info.dli_saddr else {
      return nil
    }
    let symbolAddress = UInt64(UInt(bitPattern: symbolStart))
    guard currentAddress >= symbolAddress,
      currentAddress - symbolAddress <= Self.maxSymbolMatchDistance
    else {
      return nil
    }
    let mangled = String(cString: symbolPtr)
    if let cached = cache[mangled] {
      return cached
    }
    let resolved = demangle(mangled)
    cache[mangled] = resolved
    return resolved
  }

  /// Demangles a Swift or Itanium-ABI C++ symbol on-device.
  ///
  /// Swift symbols are recognized by their `$s` / `_$s` prefix and demangled via
  /// `swift_demangle` from `libswiftCore.dylib`. C++ symbols are recognized by their
  /// `_Z` / `__Z` prefix and demangled via `__cxa_demangle` from `libc++abi.dylib`.
  ///
  /// Anything else (Objective-C selectors, plain C symbols, already-demangled names)
  /// is returned unchanged.
  static func demangle(_ symbol: String) -> String {
    if symbol.hasPrefix("$s") || symbol.hasPrefix("_$s") {
      return swiftDemangle(symbol) ?? symbol
    }
    if symbol.hasPrefix("_Z") || symbol.hasPrefix("__Z") {
      return cxxDemangle(symbol) ?? symbol
    }
    return symbol
  }

  private static func swiftDemangle(_ symbol: String) -> String? {
    return symbol.withCString { cstr in
      guard
        let ptr = _swift_demangle(
          mangledName: cstr,
          mangledNameLength: UInt(strlen(cstr)),
          outputBuffer: nil,
          outputBufferSize: nil,
          flags: 0
        )
      else {
        return nil
      }
      defer {
        free(ptr)
      }
      return String(cString: ptr)
    }
  }

  private static func cxxDemangle(_ symbol: String) -> String? {
    return symbol.withCString { cstr in
      var status: Int32 = 0
      guard let ptr = _cxa_demangle(cstr, nil, nil, &status), status == 0 else {
        return nil
      }
      defer {
        free(ptr)
      }
      return String(cString: ptr)
    }
  }

  /// Map from binary name (filename only) to its current load address (slide-adjusted).
  ///
  /// Computed once on first access. The Expo / React Native runtime links everything at
  /// startup and doesn't `dlopen` further, so the dyld image table is effectively constant
  /// for the lifetime of the process — caching it avoids ~500 `String` allocations on every
  /// crash-report ingest.
  ///
  /// Trade-off: a third-party SDK that `dlopen`s a framework after launch (rare but legal —
  /// some MDM/analytics SDKs and `Bundle.load()` of code-bearing bundles do this) will leave
  /// frames from that framework with `symbol: nil` for live `didReceive` deliveries that
  /// land after the dlopen. We accept this — past-payload processing at launch (the common
  /// path) sees the full table, and the alternative (rebuilding per ingest) costs more than
  /// it's worth for a corner case.
  private static let loadedImages: [String: UInt64] = {
    var result: [String: UInt64] = [:]
    let count = _dyld_image_count()
    for i in 0..<count {
      guard let namePtr = _dyld_get_image_name(i),
        let header = _dyld_get_image_header(i)
      else {
        continue
      }
      let path = String(cString: namePtr)
      let name = path.split(separator: "/").last.map(String.init) ?? path
      // `header` is the in-process Mach-O image base (already slide-adjusted by dyld). We rely
      // on `__TEXT` starting at the image header — true for all Apple-emitted Mach-O binaries
      // because the load commands themselves live inside `__TEXT`, so `vmaddr(__TEXT) == header`
      // — and add `offsetIntoBinaryTextSegment` to get the current-process address for `dladdr`.
      // If Apple ever ships a binary where `__TEXT` doesn't start at the header, this would be
      // off by `vmaddr(__TEXT) - header`; the robust fix is to walk `LC_SEGMENT_64` for `__TEXT`.
      let textAddress = UInt64(UInt(bitPattern: header))
      result[name] = textAddress
    }
    return result
  }()
}

// `swift_demangle` is exported by `libswiftCore.dylib` but not declared in any public header.
// The signature has been stable since Swift 4 and is what crash reporters (KSCrash, Sentry, Bugsnag)
// rely on. Returns a malloc'd C string the caller must `free`.
// swift-format-ignore: AlwaysUseLowerCamelCase
@_silgen_name("swift_demangle")
private func _swift_demangle(
  mangledName: UnsafePointer<CChar>?,
  mangledNameLength: UInt,
  outputBuffer: UnsafeMutablePointer<CChar>?,
  outputBufferSize: UnsafeMutablePointer<UInt>?,
  flags: UInt32
) -> UnsafeMutablePointer<CChar>?

// `__cxa_demangle` is the Itanium ABI C++ demangler, exported by `libc++abi.dylib` (already
// linked through `-lc++` in the test_spec / via the C++ standard library).
// On success returns a malloc'd C string the caller must `free`, and writes 0 to `status`.
// Non-zero status values mean: -1 = OOM, -2 = invalid mangled name, -3 = invalid argument.
// swift-format-ignore: AlwaysUseLowerCamelCase
@_silgen_name("__cxa_demangle")
private func _cxa_demangle(
  _ mangledName: UnsafePointer<CChar>?,
  _ outputBuffer: UnsafeMutablePointer<CChar>?,
  _ length: UnsafeMutablePointer<Int>?,
  _ status: UnsafeMutablePointer<Int32>?
) -> UnsafeMutablePointer<CChar>?
