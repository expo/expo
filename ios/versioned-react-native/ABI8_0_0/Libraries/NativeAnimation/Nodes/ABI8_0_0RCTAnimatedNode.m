/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI8_0_0RCTAnimatedNode.h"

#import "ABI8_0_0RCTDefines.h"

@implementation ABI8_0_0RCTAnimatedNode
{
  NSMutableDictionary<NSNumber *, ABI8_0_0RCTAnimatedNode *> *_childNodes;
  NSMutableDictionary<NSNumber *, ABI8_0_0RCTAnimatedNode *> *_parentNodes;
}

- (instancetype)initWithTag:(NSNumber *)tag
                     config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super init])) {
    _nodeTag = tag;
    _config = [config copy];
  }
  return self;
}

ABI8_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (NSDictionary<NSNumber *, ABI8_0_0RCTAnimatedNode *> *)childNodes
{
  return _childNodes;
}

- (NSDictionary<NSNumber *, ABI8_0_0RCTAnimatedNode *> *)parentNodes
{
  return _parentNodes;
}

- (void)addChild:(ABI8_0_0RCTAnimatedNode *)child
{
  if (!_childNodes) {
    _childNodes = [NSMutableDictionary new];
  }
  if (child) {
    _childNodes[child.nodeTag] = child;
    [child onAttachedToNode:self];
  }
}

- (void)removeChild:(ABI8_0_0RCTAnimatedNode *)child
{
  if (!_childNodes) {
    return;
  }
  if (child) {
    [_childNodes removeObjectForKey:child.nodeTag];
    [child onDetachedFromNode:self];
  }
}

- (void)onAttachedToNode:(ABI8_0_0RCTAnimatedNode *)parent
{
  if (!_parentNodes) {
    _parentNodes = [NSMutableDictionary new];
  }
  if (parent) {
    _parentNodes[parent.nodeTag] = parent;
  }
}

- (void)onDetachedFromNode:(ABI8_0_0RCTAnimatedNode *)parent
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
  for (ABI8_0_0RCTAnimatedNode *parent in _parentNodes.allValues) {
    [parent removeChild:self];
  }
  for (ABI8_0_0RCTAnimatedNode *child in _childNodes.allValues) {
    [self removeChild:child];
  }
}

- (void)setNeedsUpdate
{
  if (_needsUpdate) {
    // Has already been marked. Stop branch.
    return;
  }
  _needsUpdate = YES;
  for (ABI8_0_0RCTAnimatedNode *child in _childNodes.allValues) {
    [child setNeedsUpdate];
  }
}

- (void)cleanupAnimationUpdate
{
  if (_hasUpdated) {
    _needsUpdate = NO;
    _hasUpdated = NO;
    for (ABI8_0_0RCTAnimatedNode *child in _childNodes.allValues) {
      [child cleanupAnimationUpdate];
    }
  }
}

- (void)updateNodeIfNecessary
{
  if (_needsUpdate && !_hasUpdated) {
    for (ABI8_0_0RCTAnimatedNode *parent in _parentNodes.allValues) {
      [parent updateNodeIfNecessary];
    }
    [self performUpdate];
  }
}

- (void)performUpdate
{
  _hasUpdated = YES;
  // To be overidden by subclasses
  // This method is called on a node only if it has been marked for update
  // during the current update loop
}

@end
