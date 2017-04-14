/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI16_0_0RCTAdditionAnimatedNode.h"

@implementation ABI16_0_0RCTAdditionAnimatedNode

- (void)performUpdate
{
  [super performUpdate];
  NSArray<NSNumber *> *inputNodes = self.config[@"input"];
  if (inputNodes.count > 1) {
    ABI16_0_0RCTValueAnimatedNode *parent1 = (ABI16_0_0RCTValueAnimatedNode *)self.parentNodes[inputNodes[0]];
    ABI16_0_0RCTValueAnimatedNode *parent2 = (ABI16_0_0RCTValueAnimatedNode *)self.parentNodes[inputNodes[1]];
    if ([parent1 isKindOfClass:[ABI16_0_0RCTValueAnimatedNode class]] &&
        [parent2 isKindOfClass:[ABI16_0_0RCTValueAnimatedNode class]]) {
      self.value = parent1.value + parent2.value;
    }
  }
}

@end
