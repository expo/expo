/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTUIManagerObserverCoordinator.h"

#import <mutex>

#import "ABI48_0_0RCTUIManager.h"

@implementation ABI48_0_0RCTUIManagerObserverCoordinator {
  NSHashTable<id<ABI48_0_0RCTUIManagerObserver>> *_observers;
  std::mutex _mutex;
}

- (instancetype)init
{
  if (self = [super init]) {
    _observers = [[NSHashTable alloc] initWithOptions:NSHashTableWeakMemory capacity:0];
  }

  return self;
}

- (void)addObserver:(id<ABI48_0_0RCTUIManagerObserver>)observer
{
  std::lock_guard<std::mutex> lock(_mutex);
  [self->_observers addObject:observer];
}

- (void)removeObserver:(id<ABI48_0_0RCTUIManagerObserver>)observer
{
  std::lock_guard<std::mutex> lock(_mutex);
  [self->_observers removeObject:observer];
}

#pragma mark - ABI48_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformLayout:(ABI48_0_0RCTUIManager *)manager
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<ABI48_0_0RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerWillPerformLayout:)]) {
      [observer uiManagerWillPerformLayout:manager];
    }
  }
}

- (void)uiManagerDidPerformLayout:(ABI48_0_0RCTUIManager *)manager
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<ABI48_0_0RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerDidPerformLayout:)]) {
      [observer uiManagerDidPerformLayout:manager];
    }
  }
}

- (void)uiManagerWillPerformMounting:(ABI48_0_0RCTUIManager *)manager
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<ABI48_0_0RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerWillPerformMounting:)]) {
      [observer uiManagerWillPerformMounting:manager];
    }
  }
}

- (BOOL)uiManager:(ABI48_0_0RCTUIManager *)manager performMountingWithBlock:(ABI48_0_0RCTUIManagerMountingBlock)block
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<ABI48_0_0RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManager:performMountingWithBlock:)]) {
      if ([observer uiManager:manager performMountingWithBlock:block]) {
        return YES;
      }
    }
  }
  return NO;
}

- (void)uiManagerDidPerformMounting:(ABI48_0_0RCTUIManager *)manager
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<ABI48_0_0RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerDidPerformMounting:)]) {
      [observer uiManagerDidPerformMounting:manager];
    }
  }
}

@end
