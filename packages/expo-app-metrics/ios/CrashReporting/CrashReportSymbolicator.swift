// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation
import MachO

/**
 On-device symbolication of MetricKit `CallStackTree` frames using `dladdr`.

 Limitations:
 - Only resolves frames from binaries currently loaded in this process. System frames
   from a previous launch may not be loaded here, in which case we leave them as-is.
 - Swift symbols are demangled on-device via `swift_demangle` from `libswiftCore.dylib`.
 - No source file / line number resolution — those require the dSYM and are not on device.
 - Inlined call chains are not recovered for the same reason.

 The address arithmetic:

 MetricKit gives us the absolute address as it was at crash time, plus the offset of that
 address into the binary's `__TEXT` segment (`offsetIntoBinaryTextSegment`). The address
 we need to feed `dladdr` is the *current process's* address for the same instruction:

   currentAddress = currentLoadAddress(binaryName) + offsetIntoBinaryTextSegment

 Where `currentLoadAddress` is the slide-adjusted address of the binary's first segment
 (typically `__TEXT`) in this process. We grab it from the dyld image table.
 */
enum CrashReportSymbolicator {
  /**
   Annotates each frame in the tree with its resolved symbol, when one is available.
   */
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
    let symbol = resolveSymbol(for: frame, cache: &cache)
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
          let loadAddress = loadedImages[binaryName] else {
      return nil
    }
    let currentAddress = loadAddress + offset
    var info = Dl_info()
    guard dladdr(UnsafeRawPointer(bitPattern: UInt(currentAddress)), &info) != 0,
          let symbolPtr = info.dli_sname else {
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

  /**
   Demangles a Swift or Itanium-ABI C++ symbol on-device.

   Swift symbols are recognized by their `$s` / `_$s` prefix and demangled via
   `swift_demangle` from `libswiftCore.dylib`. C++ symbols are recognized by their
   `_Z` / `__Z` prefix and demangled via `__cxa_demangle` from `libc++abi.dylib`.

   Anything else (Objective-C selectors, plain C symbols, already-demangled names)
   is returned unchanged.
   */
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
      guard let ptr = _swift_demangle(
        mangledName: cstr,
        mangledNameLength: UInt(strlen(cstr)),
        outputBuffer: nil,
        outputBufferSize: nil,
        flags: 0
      ) else {
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

  /**
   Map from binary name (filename only) to its current load address (slide-adjusted).

   Computed once on first access. Apps don't `dlopen` libraries dynamically post-launch in
   practice (everything used by the Expo / React Native runtime is linked at startup), so
   the dyld image table is effectively constant for the lifetime of the process — caching
   it avoids ~500 `String` allocations on every crash-report ingest.
   */
  private static let loadedImages: [String: UInt64] = {
    var result: [String: UInt64] = [:]
    let count = _dyld_image_count()
    for i in 0..<count {
      guard let namePtr = _dyld_get_image_name(i),
            let header = _dyld_get_image_header(i) else {
        continue
      }
      let path = String(cString: namePtr)
      let name = path.split(separator: "/").last.map(String.init) ?? path
      // `header` is the in-process `__TEXT` base (already slide-adjusted by dyld at load time).
      // `offsetIntoBinaryTextSegment` is the offset into `__TEXT`, so adding the two yields the
      // current-process address we can pass to `dladdr`.
      let textAddress = UInt64(UInt(bitPattern: header))
      result[name] = textAddress
    }
    return result
  }()
}

// `swift_demangle` is exported by `libswiftCore.dylib` but not declared in any public header.
// The signature has been stable since Swift 4 and is what crash reporters (KSCrash, Sentry, Bugsnag)
// rely on. Returns a malloc'd C string the caller must `free`.
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
@_silgen_name("__cxa_demangle")
private func _cxa_demangle(
  _ mangledName: UnsafePointer<CChar>?,
  _ outputBuffer: UnsafeMutablePointer<CChar>?,
  _ length: UnsafeMutablePointer<Int>?,
  _ status: UnsafeMutablePointer<Int32>?
) -> UnsafeMutablePointer<CChar>?
