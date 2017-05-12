/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0RCTReloadPackagerMethod.h"

#import <objc/runtime.h>

#if ABI17_0_0RCT_DEV // Only supported in dev mode

@implementation ABI17_0_0RCTReloadPackagerMethod {
  __weak ABI17_0_0RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(ABI17_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
  }
  return self;
}

- (void)handleRequest:(__unused id)params withResponder:(ABI17_0_0RCTPackagerClientResponder *)responder
{
  [responder respondWithError:[NSString stringWithFormat: @"%@ does not support onRequest", [self class]]];
}

- (void)handleNotification:(id)params
{
  if (![params isEqual:[NSNull null]] && [params[@"debug"] boolValue]) {
    _bridge.executorClass = objc_lookUpClass("ABI17_0_0RCTWebSocketExecutor");
  }
  [_bridge reload];
}

@end

#endif
