// Copyright 2025-present 650 Industries. All rights reserved.

internal class SynchronizedHashTable<T: AnyObject> {
  private let lock = NSLock()
  private let hashTable: NSHashTable<T>

  /**
   * - Parameter weakObjects: When `true`, the backing `NSHashTable` holds weak references to its
   *   objects (entries are zeroed by the runtime when an object deallocates). When `false` (default),
   *   it holds strong references. Either way, the lock serializes `add`/`remove`/`allObjects`, so the
   *   table is never mutated while it is being iterated.
   */
  init(weakObjects: Bool = false) {
    hashTable = weakObjects ? NSHashTable<T>.weakObjects() : NSHashTable<T>()
  }

  var allObjects: [T] {
    lock.lock()
    defer { lock.unlock() }
    return Array(hashTable.allObjects)
  }

  func add(_ object: T) {
    lock.lock()
    defer { lock.unlock() }
    hashTable.add(object)
  }

  func remove(_ object: T) {
    lock.lock()
    defer { lock.unlock() }
    hashTable.remove(object)
  }
}
