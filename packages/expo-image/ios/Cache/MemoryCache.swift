import Foundation

internal final actor MemoryCache<ObjectType: AnyObject> {
  private let cache = NSCache<CacheKey, ObjectType>()

  internal func contains(key: String) -> Bool {
    return cache.object(forKey: CacheKey(key)) != nil
  }

  internal func insert(key: String, object: ObjectType) {
    cache.setObject(object, forKey: CacheKey(key))
  }

  internal func remove(key: String) {
    cache.removeObject(forKey: CacheKey(key))
  }

  // MARK: - Key

  internal final class CacheKey: Hashable {
    let key: String

    init(_ key: String) {
      self.key = key
    }

    // MARK: - Equatable

    static func == (lhs: MemoryCache.CacheKey, rhs: MemoryCache.CacheKey) -> Bool {
      return lhs.key == rhs.key
    }

    // MARK: - Hashable

    var hashValue: Int {
      return key.hashValue
    }
  }
}
