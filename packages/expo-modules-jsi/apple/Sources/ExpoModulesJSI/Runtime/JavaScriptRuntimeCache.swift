// Copyright 2026-present 650 Industries. All rights reserved.

#if canImport(os)
import os
#else
import Synchronization
#endif

extension JavaScriptRuntime {
  /// Values cached by a runtime, stored by their keys' indices. Isolated to the JavaScript thread
  /// together with the runtime that owns it. Values are read and created through
  /// ``JavaScriptRuntime/cached(_:_:)``.
  public struct Cache: ~Copyable {
    /// A key for a value that a runtime creates once and then reuses, such as a JavaScript constructor
    /// or a property name. Declare keys as `static let`s and pass them to ``JavaScriptRuntime/cached(_:_:)``.
    ///
    /// Each key gets a fixed index from a process-wide counter when it is created, so a lookup reads one
    /// array slot instead of hashing a string. Every runtime keeps its own values for the same keys.
    public struct Key<Value: AnyObject>: Sendable {
      internal let index: Int

      public init() {
        self.index = nextCacheKeyIndex.withLock { index in
          defer { index += 1 }
          return index
        }
      }
    }

    // A slot per key index, up to the highest index used so far in this runtime. Slots of keys that
    // haven't been used here yet are `nil`. `ContiguousArray` stores the references directly, without
    // the bridging checks that `Array` can do for class elements on Apple platforms.
    private var storage = ContiguousArray<AnyObject?>()

    internal func value<Value>(for key: Key<Value>) -> Value? {
      guard key.index < storage.count, let value = storage[key.index] else {
        return nil
      }
      // The key's type guarantees the type of the value stored under it.
      return unsafeDowncast(value, to: Value.self)
    }

    internal mutating func store<Value>(_ value: Value, for key: Key<Value>) {
      if key.index >= storage.count {
        storage.append(contentsOf: repeatElement(nil, count: key.index - storage.count + 1))
      }
      storage[key.index] = value
    }

    /// Releases all cached values. They often hold JSI objects, which must be destroyed before the
    /// runtime they belong to.
    internal mutating func clear() {
      storage.removeAll()
    }
  }

  /// Returns the value cached under `key`, creating it with `make` the first time the key is used in
  /// this runtime. If `make` throws, nothing is cached and the next call tries again.
  ///
  /// `make` may look up other cached values, for example to build a prototype from a cached
  /// constructor.
  @JavaScriptActor
  public func cached<Value>(_ key: Cache.Key<Value>, _ make: () throws -> Value) rethrows -> Value {
    if let value = cache.value(for: key) {
      return value
    }
    // Call `make` without accessing the cache, so that the lookups it does itself don't overlap with
    // an access in progress here.
    let value = try make()
    cache.store(value, for: key)
    return value
  }
}

/// The index for the next created ``JavaScriptRuntime/Cache/Key``. Keys can be created on any thread,
/// for example by initializing a `static let`, so the counter is behind a lock. That costs nothing on
/// the lookup path, since each key takes an index only once.
#if canImport(os)
private let nextCacheKeyIndex = OSAllocatedUnfairLock(initialState: 0)
#else
private let nextCacheKeyIndex = Mutex(0)
#endif
