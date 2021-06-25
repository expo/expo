/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import "ABI41_0_0RNCWKProcessPoolManager.h"

@interface ABI41_0_0RNCWKProcessPoolManager() {
    WKProcessPool *_sharedProcessPool;
    NSMutableDictionary<NSString *, WKProcessPool *> *_pools;
}
@end

@implementation ABI41_0_0RNCWKProcessPoolManager

- (instancetype)init
{
  if (self = [super init]) {
    _pools = [NSMutableDictionary new];
  }
  return self;
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


+ (id) sharedManager {
    static ABI41_0_0RNCWKProcessPoolManager *_sharedManager = nil;
    @synchronized(self) {
        if(_sharedManager == nil) {
            _sharedManager = [[super alloc] init];
        }
        return _sharedManager;
    }
}

- (WKProcessPool *)sharedProcessPool {
    if (!_sharedProcessPool) {
        _sharedProcessPool = [[WKProcessPool alloc] init];
    }
    return _sharedProcessPool;
}

@end

