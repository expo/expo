/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI46_0_0React/ABI46_0_0RCTModuloAnimatedNode.h>

@implementation ABI46_0_0RCTModuloAnimatedNode

- (void)performUpdate
{
  [super performUpdate];
  NSNumber *inputNode = self.config[@"input"];
  NSNumber *modulus = self.config[@"modulus"];
  ABI46_0_0RCTValueAnimatedNode *parent = (ABI46_0_0RCTValueAnimatedNode *)[self.parentNodes objectForKey:inputNode];
  const float m = modulus.floatValue;
  self.value = fmodf(fmodf(parent.value, m) + m, m);
}

@end
