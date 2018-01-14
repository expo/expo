/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTUIManagerObserverCoordinator.h"

#import <mutex>

#import "ABI25_0_0RCTUIManager.h"

@implementation ABI25_0_0RCTUIManagerObserverCoordinator {
  NSHashTable<id<ABI25_0_0RCTUIManagerObserver>> *_observers;
  std::mutex _mutex;
}

- (instancetype)init
{
  if (self = [super init]) {
    _observers = [[NSHashTable alloc] initWithOptions:NSHashTableWeakMemory capacity:0];
  }

  return self;
}

- (void)addObserver:(id<ABI25_0_0RCTUIManagerObserver>)observer
{
  std::lock_guard<std::mutex> lock(_mutex);
  [self->_observers addObject:observer];
}

- (void)removeObserver:(id<ABI25_0_0RCTUIManagerObserver>)observer
{
  std::lock_guard<std::mutex> lock(_mutex);
  [self->_observers removeObject:observer];
}

#pragma mark - ABI25_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformLayout:(ABI25_0_0RCTUIManager *)manager
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<ABI25_0_0RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerWillPerformLayout:)]) {
      [observer uiManagerWillPerformLayout:manager];
    }
  }
}

- (void)uiManagerDidPerformLayout:(ABI25_0_0RCTUIManager *)manager
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<ABI25_0_0RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerDidPerformLayout:)]) {
      [observer uiManagerDidPerformLayout:manager];
    }
  }
}

- (void)uiManagerWillPerformMounting:(ABI25_0_0RCTUIManager *)manager
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<ABI25_0_0RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerWillPerformMounting:)]) {
      [observer uiManagerWillPerformMounting:manager];
    }
  }
}

- (void)uiManagerDidPerformMounting:(ABI25_0_0RCTUIManager *)manager
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<ABI25_0_0RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerDidPerformMounting:)]) {
      [observer uiManagerDidPerformMounting:manager];
    }
  }
}


@end
