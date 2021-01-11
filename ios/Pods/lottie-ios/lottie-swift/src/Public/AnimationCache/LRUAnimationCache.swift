//
//  LRUAnimationCache.swift
//  lottie-swift
//
//  Created by Brandon Withrow on 2/5/19.
//

import Foundation

/**
 An Animation Cache that will store animations up to `cacheSize`.
 
 Once `cacheSize` is reached, the least recently used animation will be ejected.
 The default size of the cache is 100.
 */
public class LRUAnimationCache: AnimationCacheProvider {

  public init() { }
  
  /// Clears the Cache.
  public func clearCache() {
    cacheMap.removeAll()
    lruList.removeAll()
  }
  
  /// The global shared Cache.
  public static let sharedCache = LRUAnimationCache()
  
  /// The size of the cache.
  public var cacheSize: Int = 100
  
  public func animation(forKey: String) -> Animation? {
    guard let animation = cacheMap[forKey] else {
      return nil
    }
    if let index = lruList.firstIndex(of: forKey) {
      lruList.remove(at: index)
      lruList.append(forKey)
    }
    return animation
  }
  
  public func setAnimation(_ animation: Animation, forKey: String) {
    cacheMap[forKey] = animation
    lruList.append(forKey)
    if lruList.count > cacheSize {
      let removed = lruList.remove(at: 0)
      if removed != forKey {
        cacheMap[removed] = nil
      }
    }
  }
  
  fileprivate var cacheMap: [String : Animation] = [:]
  fileprivate var lruList: [String] = []
  
}
