/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI36_0_0React/ABI36_0_0RCTAdditionAnimatedNode.h>

@implementation ABI36_0_0RCTAdditionAnimatedNode

- (void)performUpdate
{
  [super performUpdate];
  NSArray<NSNumber *> *inputNodes = self.config[@"input"];
  if (inputNodes.count > 1) {
    ABI36_0_0RCTValueAnimatedNode *parent1 = (ABI36_0_0RCTValueAnimatedNode *)[self.parentNodes objectForKey:inputNodes[0]];
    ABI36_0_0RCTValueAnimatedNode *parent2 = (ABI36_0_0RCTValueAnimatedNode *)[self.parentNodes objectForKey:inputNodes[1]];
    if ([parent1 isKindOfClass:[ABI36_0_0RCTValueAnimatedNode class]] &&
        [parent2 isKindOfClass:[ABI36_0_0RCTValueAnimatedNode class]]) {
      self.value = parent1.value + parent2.value;
    }
  }
}

@end
