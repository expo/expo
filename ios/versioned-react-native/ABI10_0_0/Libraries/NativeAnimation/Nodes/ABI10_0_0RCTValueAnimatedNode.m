/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTValueAnimatedNode.h"

@implementation ABI10_0_0RCTValueAnimatedNode

- (void)setValue:(CGFloat)value
{
  _value = value;

  if (_valueObserver) {
    [_valueObserver animatedNode:self didUpdateValue:_value];
  }
}

@end
