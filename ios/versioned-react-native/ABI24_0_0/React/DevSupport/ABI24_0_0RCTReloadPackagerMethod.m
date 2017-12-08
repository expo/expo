/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI24_0_0RCTReloadPackagerMethod.h"

#import "ABI24_0_0RCTBridge.h"

#if ABI24_0_0RCT_DEV // Only supported in dev mode

@implementation ABI24_0_0RCTReloadPackagerMethod {
  ABI24_0_0RCTReloadPackagerMethodBlock _block;
  dispatch_queue_t _callbackQueue;
}

- (instancetype)initWithReloadCommand:(ABI24_0_0RCTReloadPackagerMethodBlock)block callbackQueue:(dispatch_queue_t)callbackQueue
{
  if (self = [super init]) {
    _block = [block copy];
    _callbackQueue = callbackQueue;
  }
  return self;
}

- (void)handleRequest:(__unused id)params withResponder:(ABI24_0_0RCTPackagerClientResponder *)responder
{
  [responder respondWithError:[NSString stringWithFormat: @"%@ does not support onRequest", [self class]]];
}

- (void)handleNotification:(id)params
{
  _block(params);
}

- (dispatch_queue_t)methodQueue
{
  return _callbackQueue;
}

@end

#endif
