/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTSwitch.h"

#import "ABI37_0_0RCTEventDispatcher.h"
#import "ABI37_0_0UIView+React.h"

@implementation ABI37_0_0RCTSwitch

- (void)setOn:(BOOL)on animated:(BOOL)animated {
  _wasOn = on;
  [super setOn:on animated:animated];
}

@end
