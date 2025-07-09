// Copyright 2025-present 650 Industries. All rights reserved.

internal class SynchronizedHashTable<T: AnyObject> {
  private let lock = NSLock()
  private var hashTable: NSHashTable<T> = NSHashTable()
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
