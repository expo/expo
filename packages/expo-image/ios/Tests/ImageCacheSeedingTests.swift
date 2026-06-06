import Foundation
import Testing

internal import SDWebImage

@testable import ExpoImage

// A 1x1 red PNG, the smallest valid image we can seed the cache with.
private let imageData = Data(
  base64Encoded: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
)!

private func makeCacheKey() -> String {
  return "expo-image-test-\(UUID().uuidString)"
}

private func store(image: UIImage?, imageData: Data?, forKey key: String) async {
  await withCheckedContinuation { continuation in
    SDImageCache.shared.store(image, imageData: imageData, forKey: key, toDisk: true) {
      continuation.resume()
    }
  }
}

private func storeDataToDisk(_ data: Data, forKey key: String) async {
  await withCheckedContinuation { continuation in
    SDImageCache.shared.storeImageData(data, forKey: key) {
      continuation.resume()
    }
  }
}

private func queryCache(forKey key: String) async -> (image: UIImage?, cacheType: SDImageCacheType) {
  return await withCheckedContinuation { continuation in
    SDImageCache.shared.queryCacheOperation(forKey: key) { image, _, cacheType in
      continuation.resume(returning: (image, cacheType))
    }
  }
}

private func removeImage(forKey key: String) {
  SDImageCache.shared.removeImage(forKey: key, fromDisk: true, withCompletion: nil)
}

// Exercises the cache-key contract that `writeToCacheAsync`/`readFromCacheAsync` rely on:
// image data stored under a key must be queryable back under the same key, and an unseeded key
// must miss. Each test uses a unique key and cleans up after itself so the shared `SDImageCache`
// doesn't leak state between cases.
@Suite("ImageCacheSeeding")
struct ImageCacheSeedingTests {
  @Test
  func `reads back an image stored under a custom key`() async {
    let cacheKey = makeCacheKey()
    let image = SDImageCodersManager.shared.decodedImage(with: imageData, options: nil)

    // Mirrors `writeToCacheAsync`: store image + original data to disk under the custom key.
    await store(image: image, imageData: imageData, forKey: cacheKey)
    // Mirrors `readFromCacheAsync`: query the cache back by the same key.
    let result = await queryCache(forKey: cacheKey)

    #expect(result.image != nil)
    removeImage(forKey: cacheKey)
  }

  @Test
  func `reads back an image seeded straight to disk after the memory cache is cleared`() async {
    let cacheKey = makeCacheKey()

    await storeDataToDisk(imageData, forKey: cacheKey)
    // Drop the in-memory copy so the query has to hit disk, like a fresh app launch would.
    SDImageCache.shared.clearMemory()
    let result = await queryCache(forKey: cacheKey)

    #expect(result.image != nil)
    #expect(result.cacheType == .disk)
    removeImage(forKey: cacheKey)
  }

  @Test
  func `returns nil for a key that was never seeded`() async {
    let cacheKey = makeCacheKey()

    let result = await queryCache(forKey: cacheKey)

    #expect(result.image == nil)
  }

  @Test
  func `exposes a disk path for a seeded key`() async {
    let cacheKey = makeCacheKey()

    await storeDataToDisk(imageData, forKey: cacheKey)
    let exists = await withCheckedContinuation { continuation in
      SDImageCache.shared.diskImageExists(withKey: cacheKey) { exists in
        continuation.resume(returning: exists)
      }
    }

    #expect(exists)
    #expect(SDImageCache.shared.cachePath(forKey: cacheKey) != nil)
    removeImage(forKey: cacheKey)
  }
}
