/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTUIManagerObserverCoordinator.h"

#import <mutex>

#import "ABI34_0_0RCTUIManager.h"

@implementation ABI34_0_0RCTUIManagerObserverCoordinator {
  NSHashTable<id<ABI34_0_0RCTUIManagerObserver>> *_observers;
  std::mutex _mutex;
}

- (instancetype)init
{
  if (self = [super init]) {
    _observers = [[NSHashTable alloc] initWithOptions:NSHashTableWeakMemory capacity:0];
  }

  return self;
}

- (void)addObserver:(id<ABI34_0_0RCTUIManagerObserver>)observer
{
  std::lock_guard<std::mutex> lock(_mutex);
  [self->_observers addObject:observer];
}

- (void)removeObserver:(id<ABI34_0_0RCTUIManagerObserver>)observer
{
  std::lock_guard<std::mutex> lock(_mutex);
  [self->_observers removeObject:observer];
}

#pragma mark - ABI34_0_0RCTUIManagerObserver

- (void)uiManagerWillPerformLayout:(ABI34_0_0RCTUIManager *)manager
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<ABI34_0_0RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerWillPerformLayout:)]) {
      [observer uiManagerWillPerformLayout:manager];
    }
  }
}

- (void)uiManagerDidPerformLayout:(ABI34_0_0RCTUIManager *)manager
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<ABI34_0_0RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerDidPerformLayout:)]) {
      [observer uiManagerDidPerformLayout:manager];
    }
  }
}

- (void)uiManagerWillPerformMounting:(ABI34_0_0RCTUIManager *)manager
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<ABI34_0_0RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerWillPerformMounting:)]) {
      [observer uiManagerWillPerformMounting:manager];
    }
  }
}

- (BOOL)uiManager:(ABI34_0_0RCTUIManager *)manager performMountingWithBlock:(ABI34_0_0RCTUIManagerMountingBlock)block
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<ABI34_0_0RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManager:performMountingWithBlock:)]) {
      if ([observer uiManager:manager performMountingWithBlock:block]) {
        return YES;
      }
    }
  }
  return NO;
}

- (void)uiManagerDidPerformMounting:(ABI34_0_0RCTUIManager *)manager
{
  std::lock_guard<std::mutex> lock(_mutex);

  for (id<ABI34_0_0RCTUIManagerObserver> observer in _observers) {
    if ([observer respondsToSelector:@selector(uiManagerDidPerformMounting:)]) {
      [observer uiManagerDidPerformMounting:manager];
    }
  }
}


@end
