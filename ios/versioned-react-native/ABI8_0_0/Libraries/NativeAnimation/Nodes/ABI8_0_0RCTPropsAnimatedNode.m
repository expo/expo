/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI8_0_0RCTPropsAnimatedNode.h"
#import "ABI8_0_0RCTAnimationUtils.h"
#import "ABI8_0_0RCTNativeAnimatedModule.h"
#import "ABI8_0_0RCTStyleAnimatedNode.h"
#import "ABI8_0_0RCTViewPropertyMapper.h"

@implementation ABI8_0_0RCTPropsAnimatedNode
{
  ABI8_0_0RCTStyleAnimatedNode *_parentNode;
}

- (void)onAttachedToNode:(ABI8_0_0RCTAnimatedNode *)parent
{
  [super onAttachedToNode:parent];
  if ([parent isKindOfClass:[ABI8_0_0RCTStyleAnimatedNode class]]) {
    _parentNode = (ABI8_0_0RCTStyleAnimatedNode *)parent;
  }
}

- (void)onDetachedFromNode:(ABI8_0_0RCTAnimatedNode *)parent
{
  [super onDetachedFromNode:parent];
  if (_parentNode == parent) {
    _parentNode = nil;
  }
}

- (void)connectToView:(NSNumber *)viewTag animatedModule:(ABI8_0_0RCTNativeAnimatedModule *)animationModule
{
  _propertyMapper = [[ABI8_0_0RCTViewPropertyMapper alloc] initWithViewTag:viewTag animationModule:animationModule];
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
