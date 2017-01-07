/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTDivisionAnimatedNode.h"

#import <ReactABI13_0_0/ABI13_0_0RCTLog.h>

@implementation ABI13_0_0RCTDivisionAnimatedNode

- (void)performUpdate
{
  [super performUpdate];

  NSArray<NSNumber *> *inputNodes = self.config[@"input"];
  if (inputNodes.count > 1) {
    ABI13_0_0RCTValueAnimatedNode *parent1 = (ABI13_0_0RCTValueAnimatedNode *)self.parentNodes[inputNodes[0]];
    ABI13_0_0RCTValueAnimatedNode *parent2 = (ABI13_0_0RCTValueAnimatedNode *)self.parentNodes[inputNodes[1]];
    if ([parent1 isKindOfClass:[ABI13_0_0RCTValueAnimatedNode class]] &&
        [parent2 isKindOfClass:[ABI13_0_0RCTValueAnimatedNode class]]) {
      if (parent2.value == 0) {
        ABI13_0_0RCTLogError(@"Detected a division by zero in Animated.divide node");
        return;
      }
      self.value = parent1.value / parent2.value;
    }
  }
}

@end
