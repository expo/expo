/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI11_0_0RCTPropsAnimatedNode.h"
#import "ABI11_0_0RCTAnimationUtils.h"
#import "ABI11_0_0RCTNativeAnimatedModule.h"
#import "ABI11_0_0RCTStyleAnimatedNode.h"
#import "ABI11_0_0RCTViewPropertyMapper.h"

@implementation ABI11_0_0RCTPropsAnimatedNode
{
  ABI11_0_0RCTStyleAnimatedNode *_parentNode;
}

- (void)onAttachedToNode:(ABI11_0_0RCTAnimatedNode *)parent
{
  [super onAttachedToNode:parent];
  if ([parent isKindOfClass:[ABI11_0_0RCTStyleAnimatedNode class]]) {
    _parentNode = (ABI11_0_0RCTStyleAnimatedNode *)parent;
  }
}

- (void)onDetachedFromNode:(ABI11_0_0RCTAnimatedNode *)parent
{
  [super onDetachedFromNode:parent];
  if (_parentNode == parent) {
    _parentNode = nil;
  }
}

- (void)connectToView:(NSNumber *)viewTag animatedModule:(ABI11_0_0RCTNativeAnimatedModule *)animationModule
{
  _propertyMapper = [[ABI11_0_0RCTViewPropertyMapper alloc] initWithViewTag:viewTag animationModule:animationModule];
}

- (void)disconnectFromView:(NSNumber *)viewTag
{
  _propertyMapper = nil;
}

- (void)performUpdate
{
  [super performUpdate];
  [self performViewUpdatesIfNecessary];
}

- (void)performViewUpdatesIfNecessary
{
  NSDictionary *updates = [_parentNode updatedPropsDictionary];
  if (updates.count) {
    [_propertyMapper updateViewWithDictionary:updates];
  }
}

@end
