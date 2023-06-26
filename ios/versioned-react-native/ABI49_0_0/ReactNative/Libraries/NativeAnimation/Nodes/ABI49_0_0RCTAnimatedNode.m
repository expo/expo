/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTAnimatedNode.h>

#import <ABI49_0_0React/ABI49_0_0RCTDefines.h>

@implementation ABI49_0_0RCTAnimatedNode {
  NSMapTable<NSNumber *, ABI49_0_0RCTAnimatedNode *> *_childNodes;
  NSMapTable<NSNumber *, ABI49_0_0RCTAnimatedNode *> *_parentNodes;
}

- (instancetype)initWithTag:(NSNumber *)tag config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super init])) {
    _nodeTag = tag;
    _config = [config copy];
  }
  return self;
}

ABI49_0_0RCT_NOT_IMPLEMENTED(-(instancetype)init)

- (NSMapTable<NSNumber *, ABI49_0_0RCTAnimatedNode *> *)childNodes
{
  return _childNodes;
}

- (NSMapTable<NSNumber *, ABI49_0_0RCTAnimatedNode *> *)parentNodes
{
  return _parentNodes;
}

- (void)addChild:(ABI49_0_0RCTAnimatedNode *)child
{
  if (!_childNodes) {
    _childNodes = [NSMapTable strongToWeakObjectsMapTable];
  }
  if (child) {
    [_childNodes setObject:child forKey:child.nodeTag];
    [child onAttachedToNode:self];
  }
}

- (void)removeChild:(ABI49_0_0RCTAnimatedNode *)child
{
  if (!_childNodes) {
    return;
  }
  if (child) {
    [_childNodes removeObjectForKey:child.nodeTag];
    [child onDetachedFromNode:self];
  }
}

- (void)onAttachedToNode:(ABI49_0_0RCTAnimatedNode *)parent
{
  if (!_parentNodes) {
    _parentNodes = [NSMapTable strongToWeakObjectsMapTable];
  }
  if (parent) {
    [_parentNodes setObject:parent forKey:parent.nodeTag];
  }
}

- (void)onDetachedFromNode:(ABI49_0_0RCTAnimatedNode *)parent
{
  if (!_parentNodes) {
    return;
  }
  if (parent) {
    [_parentNodes removeObjectForKey:parent.nodeTag];
  }
}

- (void)detachNode
{
  for (ABI49_0_0RCTAnimatedNode *parent in _parentNodes.objectEnumerator) {
    [parent removeChild:self];
  }
  for (ABI49_0_0RCTAnimatedNode *child in _childNodes.objectEnumerator) {
    [self removeChild:child];
  }
}

- (void)setNeedsUpdate
{
  _needsUpdate = YES;
  for (ABI49_0_0RCTAnimatedNode *child in _childNodes.objectEnumerator) {
    [child setNeedsUpdate];
  }
}

- (void)updateNodeIfNecessary
{
  if (_needsUpdate) {
    for (ABI49_0_0RCTAnimatedNode *parent in _parentNodes.objectEnumerator) {
      [parent updateNodeIfNecessary];
    }
    [self performUpdate];
  }
}

- (void)performUpdate
{
  _needsUpdate = NO;
  // To be overridden by subclasses
  // This method is called on a node only if it has been marked for update
  // during the current update loop
}

- (BOOL)isManagedByFabric
{
  for (ABI49_0_0RCTAnimatedNode *child in _childNodes.objectEnumerator) {
    if ([child isManagedByFabric]) {
      return YES;
    }
  }
  return NO;
}

@end
