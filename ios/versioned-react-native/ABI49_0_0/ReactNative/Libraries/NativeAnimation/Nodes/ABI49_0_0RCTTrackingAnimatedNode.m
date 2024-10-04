/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0React/ABI49_0_0RCTNativeAnimatedNodesManager.h>
#import <ABI49_0_0React/ABI49_0_0RCTTrackingAnimatedNode.h>
#import <ABI49_0_0React/ABI49_0_0RCTValueAnimatedNode.h>

@implementation ABI49_0_0RCTTrackingAnimatedNode {
  NSNumber *_animationId;
  NSNumber *_toValueNodeTag;
  NSNumber *_valueNodeTag;
  NSMutableDictionary *_animationConfig;
}

- (instancetype)initWithTag:(NSNumber *)tag config:(NSDictionary<NSString *, id> *)config
{
  if ((self = [super initWithTag:tag config:config])) {
    _animationId = config[@"animationId"];
    _toValueNodeTag = config[@"toValue"];
    _valueNodeTag = config[@"value"];
    _animationConfig = [NSMutableDictionary dictionaryWithDictionary:config[@"animationConfig"]];
  }
  return self;
}

- (void)onDetachedFromNode:(ABI49_0_0RCTAnimatedNode *)parent
{
  [self.manager stopAnimation:_animationId];
  [super onDetachedFromNode:parent];
}

- (void)performUpdate
{
  [super performUpdate];

  // change animation config's "toValue" to reflect updated value of the parent node
  ABI49_0_0RCTValueAnimatedNode *node = (ABI49_0_0RCTValueAnimatedNode *)[self.parentNodes objectForKey:_toValueNodeTag];
  _animationConfig[@"toValue"] = @(node.value);

  [self.manager startAnimatingNode:_animationId nodeTag:_valueNodeTag config:_animationConfig endCallback:nil];
}

@end
