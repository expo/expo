/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTMultiplicationAnimatedNode.h"

@implementation ABI27_0_0RCTMultiplicationAnimatedNode

- (void)performUpdate
{
  [super performUpdate];

  NSArray<NSNumber *> *inputNodes = self.config[@"input"];
  if (inputNodes.count > 1) {
    ABI27_0_0RCTValueAnimatedNode *parent1 = (ABI27_0_0RCTValueAnimatedNode *)[self.parentNodes objectForKey:inputNodes[0]];
    ABI27_0_0RCTValueAnimatedNode *parent2 = (ABI27_0_0RCTValueAnimatedNode *)[self.parentNodes objectForKey:inputNodes[1]];
    if ([parent1 isKindOfClass:[ABI27_0_0RCTValueAnimatedNode class]] &&
        [parent2 isKindOfClass:[ABI27_0_0RCTValueAnimatedNode class]]) {
      self.value = parent1.value * parent2.value;
    }
  }
}

@end
