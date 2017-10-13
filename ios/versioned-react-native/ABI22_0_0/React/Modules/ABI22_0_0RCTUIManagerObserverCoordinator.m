/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI22_0_0RCTUIManagerObserverCoordinator.h"

#import "ABI22_0_0RCTUIManager.h"

@implementation ABI22_0_0RCTUIManagerObserverCoordinator {
  NSHashTable<id<ABI22_0_0RCTUIManagerObserver>> *_observers;
}

- (instancetype)init
{
  if (self = [super init]) {
    _observers = [[NSHashTable alloc] initWithOptions:NSHashTableWeakMemory capacity:0];
  }

  return self;
}

- (void)addObserver:(id<ABI22_0_0RCTUIManagerObserver>)observer
{
  dispatch_async(ABI22_0_0RCTGetUIManagerQueue(), ^{
    [self->_observers addObject:observer];
  });
}

- (void)removeObserver:(id<ABI22_0_0RCTUIManagerObserver>)observer
{
  dispatch_async(ABI22_0_0RCTGetUIManagerQueue(), ^{
    [self->_observers removeObject:observer];
  });
}

#pragma mark - ABI22_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformLayout:(ABI22_0_0RCTUIManager *)manager
{
  for (id<ABI22_0_0RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerWillPerformLayout:)]) {
      [observer uiManagerWillPerformLayout:manager];
    }
  }
}

- (void)uiManagerDidPerformLayout:(ABI22_0_0RCTUIManager *)manager
{
  for (id<ABI22_0_0RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerDidPerformLayout:)]) {
      [observer uiManagerDidPerformLayout:manager];
    }
  }
}

- (void)uiManagerWillFlushUIBlocks:(ABI22_0_0RCTUIManager *)manager
{
  for (id<ABI22_0_0RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerWillFlushUIBlocks:)]) {
      [observer uiManagerWillFlushUIBlocks:manager];
    }
  }
}

@end
