/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTModuloAnimatedNode.h"

@implementation ABI32_0_0RCTModuloAnimatedNode

- (void)performUpdate
{
  [super performUpdate];
  NSNumber *inputNode = self.config[@"input"];
  NSNumber *modulus = self.config[@"modulus"];
  ABI32_0_0RCTValueAnimatedNode *parent = (ABI32_0_0RCTValueAnimatedNode *)[self.parentNodes objectForKey:inputNode];
  self.value = fmodf(parent.value, modulus.floatValue);
}

@end
