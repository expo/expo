/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTGenericDelegateSplitter.h"

@implementation ABI42_0_0RCTGenericDelegateSplitter {
  NSHashTable *_delegates;
}

#pragma mark - Public

- (instancetype)initWithDelegateUpdateBlock:(void (^)(id _Nullable delegate))block
{
  if (self = [super init]) {
    _delegateUpdateBlock = block;
    _delegates = [NSHashTable weakObjectsHashTable];
  }

  return self;
}

- (void)addDelegate:(id)delegate
{
  [_delegates addObject:delegate];
  [self _updateDelegate];
}

- (void)removeDelegate:(id)delegate
{
  [_delegates removeObject:delegate];
  [self _updateDelegate];
}

- (void)removeAllDelegates
{
  [_delegates removeAllObjects];
  [self _updateDelegate];
}

#pragma mark - Private

- (void)_updateDelegate
{
  _delegateUpdateBlock(nil);
  if (_delegates.count == 0) {
    return;
  }

  _delegateUpdateBlock(_delegates.count == 1 ? [_delegates allObjects].firstObject : self);
}

#pragma mark - Fast Forwarding

- (BOOL)respondsToSelector:(SEL)selector
{
  for (id delegate in _delegates) {
    if ([delegate respondsToSelector:selector]) {
      return YES;
    }
  }

  return NO;
}

- (NSMethodSignature *)methodSignatureForSelector:(SEL)selector
{
  for (id delegate in _delegates) {
    if ([delegate respondsToSelector:selector]) {
      return [delegate methodSignatureForSelector:selector];
    }
  }
  return nil;
}

- (void)forwardInvocation:(NSInvocation *)invocation
{
  NSMutableArray *targets = [[NSMutableArray alloc] initWithCapacity:_delegates.count];

  for (id delegate in _delegates) {
    if ([delegate respondsToSelector:[invocation selector]]) {
      [targets addObject:delegate];
    }
  }

  for (id target in targets) {
    [invocation invokeWithTarget:target];
  }
}

@end
