/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTJSThread.h"

dispatch_queue_t ABI48_0_0RCTJSThread;

void _ABI48_0_0RCTInitializeJSThreadConstantInternal(void)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // Set up JS thread
    ABI48_0_0RCTJSThread = (id)kCFNull;
  });
}
