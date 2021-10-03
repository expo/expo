/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI43_0_0RCTErrorInfo.h"

#import "ABI43_0_0RCTJSStackFrame.h"

@implementation ABI43_0_0RCTErrorInfo

- (instancetype)initWithErrorMessage:(NSString *)errorMessage stack:(NSArray<ABI43_0_0RCTJSStackFrame *> *)stack
{
  self = [super init];
  if (self) {
    _errorMessage = [errorMessage copy];
    _stack = [stack copy];
  }
  return self;
}

@end
