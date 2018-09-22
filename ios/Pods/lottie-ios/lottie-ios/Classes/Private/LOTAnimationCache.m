//
//  LOTAnimationCache.m
//  Lottie
//
//  Created by Brandon Withrow on 1/9/17.
//  Copyright © 2017 Brandon Withrow. All rights reserved.
//

#import "LOTAnimationCache.h"

const NSInteger kLOTCacheSize = 50;

@implementation LOTAnimationCache {
  NSMutableDictionary *animationsCache_;
  NSMutableArray *lruOrderArray_;
}

+ (instancetype)sharedCache {
  static LOTAnimationCache *sharedCache = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedCache = [[self alloc] init];
  });
  return sharedCache;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    animationsCache_ = [[NSMutableDictionary alloc] init];
    lruOrderArray_ = [[NSMutableArray alloc] init];
  }
  return self;
}

- (void)addAnimation:(LOTComposition *)animation forKey:(NSString *)key {
  if (lruOrderArray_.count >= kLOTCacheSize) {
    NSString *oldKey = lruOrderArray_[0];
    [animationsCache_ removeObjectForKey:oldKey];
    [lruOrderArray_ removeObject:oldKey];
  }
  [lruOrderArray_ removeObject:key];
  [lruOrderArray_ addObject:key];
  [animationsCache_ setObject:animation forKey:key];
}

- (LOTComposition *)animationForKey:(NSString *)key {
  if (!key) {
    return nil;
  }
  LOTComposition *animation = [animationsCache_ objectForKey:key];
  [lruOrderArray_ removeObject:key];
  [lruOrderArray_ addObject:key];
  return animation;
}

- (void)clearCache {
  [animationsCache_ removeAllObjects];
  [lruOrderArray_ removeAllObjects];
}

- (void)removeAnimationForKey:(NSString *)key {
  [lruOrderArray_ removeObject:key];
  [animationsCache_ removeObjectForKey:key];
}

- (void)disableCaching {
  [self clearCache];
  animationsCache_ = nil;
  lruOrderArray_ = nil;
}

@end
