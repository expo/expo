/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI48_0_0React/ABI48_0_0RCTColorAnimatedNode.h>
#import <ABI48_0_0React/ABI48_0_0RCTValueAnimatedNode.h>

@implementation ABI48_0_0RCTColorAnimatedNode

- (void)performUpdate
{
  [super performUpdate];

  ABI48_0_0RCTValueAnimatedNode *rNode = (ABI48_0_0RCTValueAnimatedNode *)[self.parentNodes objectForKey:self.config[@"r"]];
  ABI48_0_0RCTValueAnimatedNode *gNode = (ABI48_0_0RCTValueAnimatedNode *)[self.parentNodes objectForKey:self.config[@"g"]];
  ABI48_0_0RCTValueAnimatedNode *bNode = (ABI48_0_0RCTValueAnimatedNode *)[self.parentNodes objectForKey:self.config[@"b"]];
  ABI48_0_0RCTValueAnimatedNode *aNode = (ABI48_0_0RCTValueAnimatedNode *)[self.parentNodes objectForKey:self.config[@"a"]];

  _color = ((int)round(aNode.value * 255) & 0xff) << 24 | ((int)round(rNode.value) & 0xff) << 16 |
      ((int)round(gNode.value) & 0xff) << 8 | ((int)round(bNode.value) & 0xff);

  // TODO (T111179606): Support platform colors for color animations
}

@end
