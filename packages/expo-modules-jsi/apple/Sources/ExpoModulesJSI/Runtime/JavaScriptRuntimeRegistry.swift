// Copyright 2026-present 650 Industries. All rights reserved.

internal import ExpoModulesJSI_Cxx
import os

/// The handles of the live runtimes, by the address of their `jsi::Runtime`. Every runtime adds its
/// handle in its initializers and removes it in `deinit`, before it detaches the handle, so an entry
/// never has a detached handle. It keeps handles rather than `weak` references to the runtimes, for
/// the reason that ``JavaScriptRuntimeHandle`` describes.
///
/// Each change advances the registry's generation, which tells ``JavaScriptRuntime/for(unsafePointer:)``
/// whether the runtime it remembers on a thread is still the one at that address.
internal enum JavaScriptRuntimeRegistry {
  private struct Entry: Sendable {
    /// The address of the `jsi::Runtime`, as an integer, which is `Sendable`.
    let runtimeAddress: UInt
    let handle: JavaScriptRuntimeHandle
  }

  /// Only a few runtimes are alive at the same time, so a linear search is enough.
  private static let entries = OSAllocatedUnfairLock<[Entry]>(initialState: [])

  internal static func add(_ handle: JavaScriptRuntimeHandle, runtimePointer: UnsafeRawPointer) {
    let runtimeAddress = UInt(bitPattern: runtimePointer)
    entries.withLock { entries in
      entries.append(Entry(runtimeAddress: runtimeAddress, handle: handle))
      expo.advanceRuntimeRegistryGeneration()
    }
  }

  internal static func remove(_ handle: JavaScriptRuntimeHandle) {
    entries.withLock { entries in
      entries.removeAll { $0.handle === handle }
      expo.advanceRuntimeRegistryGeneration()
    }
  }

  /// Returns the handle of the runtime with the given `jsi::Runtime` address. When a new runtime got the
  /// address of one that is gone but whose wrapper is still alive, the newest one wins.
  internal static func handle(runtimePointer: UnsafeRawPointer) -> JavaScriptRuntimeHandle? {
    let runtimeAddress = UInt(bitPattern: runtimePointer)
    return entries.withLock { entries in
      entries.last { $0.runtimeAddress == runtimeAddress }?.handle
    }
  }
}

extension JavaScriptRuntime {
  /// Returns the runtime that wraps the `jsi::Runtime` at the given address, or `nil` if no live
  /// `JavaScriptRuntime` wraps it. It's for code that has only the engine runtime's address, which is
  /// the address that ``withUnsafePointee(_:)`` gives.
  ///
  /// It remembers the last runtime it found on the current thread, so finding the same runtime again
  /// costs no lock. Call it only on the JavaScript thread of the runtime it finds, like other uses of
  /// the runtime. It's a helper for `expo-modules-core`, so it isn't part of the public API.
  @_spi(Internal)
  public static func `for`(unsafePointer runtimePointer: UnsafeRawPointer) -> JavaScriptRuntime? {
    let cache = expo.currentThreadRuntimeLookupCache()
    // Read before the registry, so a change that happens during the lookup invalidates the entry.
    let generation = expo.currentRuntimeRegistryGeneration()

    if cache.pointee.runtimeAddress == runtimePointer, cache.pointee.generation == generation,
      let handle = cache.pointee.handle
    {
      // The registry holds the handle as long as the generation stays the same.
      return Unmanaged<JavaScriptRuntimeHandle>.fromOpaque(handle)._withUnsafeGuaranteedRef { $0.runtime }
    }
    guard let handle = JavaScriptRuntimeRegistry.handle(runtimePointer: runtimePointer) else {
      return nil
    }
    cache.pointee.runtimeAddress = runtimePointer
    cache.pointee.handle = UnsafeRawPointer(Unmanaged.passUnretained(handle).toOpaque())
    cache.pointee.generation = generation
    return handle.runtime
  }
}
