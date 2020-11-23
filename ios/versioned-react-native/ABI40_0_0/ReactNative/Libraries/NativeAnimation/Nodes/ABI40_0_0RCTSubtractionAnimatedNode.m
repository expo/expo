/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI40_0_0React/ABI40_0_0RCTSubtractionAnimatedNode.h>

@implementation ABI40_0_0RCTSubtractionAnimatedNode

- (void)performUpdate
{
  [super performUpdate];
  NSArray<NSNumber *> *inputNodes = self.config[@"input"];
  if (inputNodes.count > 1) {
    ABI40_0_0RCTValueAnimatedNode *parent1 = (ABI40_0_0RCTValueAnimatedNode *)[self.parentNodes objectForKey:inputNodes[0]];
    ABI40_0_0RCTValueAnimatedNode *parent2 = (ABI40_0_0RCTValueAnimatedNode *)[self.parentNodes objectForKey:inputNodes[1]];
    if ([parent1 isKindOfClass:[ABI40_0_0RCTValueAnimatedNode class]] &&
        [parent2 isKindOfClass:[ABI40_0_0RCTValueAnimatedNode class]]) {
      self.value = parent1.value - parent2.value;
    }
  }
}

@end

