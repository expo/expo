/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import "RNCWKProcessPoolManager.h"

@interface RNCWKProcessPoolManager() {
  WKProcessPool *_sharedProcessPool;
  NSMutableDictionary<NSString *, WKProcessPool *> *_pools;
}
@end

@implementation RNCWKProcessPoolManager

+ (id) sharedManager {
    static RNCWKProcessPoolManager *_sharedManager = nil;
    @synchronized(self) {
        if(_sharedManager == nil) {
            _sharedManager = [[super alloc] init];
        }
        return _sharedManager;
    }
}

- (instancetype)init
{
  if (self = [super init]) {
    _pools = [NSMutableDictionary new];
  }
  return self;
}

- (WKProcessPool *)sharedProcessPool {
    if (!_sharedProcessPool) {
        _sharedProcessPool = [[WKProcessPool alloc] init];
    }
    return _sharedProcessPool;
}

- (WKProcessPool *)sharedProcessPoolForExperienceId:(NSString *)experienceId
{
  if (!experienceId) {
    return [self sharedProcessPool];
  }

  if (!_pools[experienceId]) {
    _pools[experienceId] = [[WKProcessPool alloc] init];
  }

  return _pools[experienceId];
}

@end

