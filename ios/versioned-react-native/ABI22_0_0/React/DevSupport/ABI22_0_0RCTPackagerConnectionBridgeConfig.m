/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI22_0_0RCTPackagerConnectionBridgeConfig.h"

#import <ReactABI22_0_0/ABI22_0_0RCTBridge.h>

#import "ABI22_0_0RCTJSEnvironment.h"
#import "ABI22_0_0RCTReloadPackagerMethod.h"
#import "ABI22_0_0RCTSamplingProfilerPackagerMethod.h"

#if ABI22_0_0RCT_DEV // Only supported in dev mode

@implementation ABI22_0_0RCTPackagerConnectionBridgeConfig {
  ABI22_0_0RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(ABI22_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
  }
  return self;
}

- (NSURL *)packagerURL
{
  NSString *host = [_bridge.bundleURL host];
  NSString *scheme = [_bridge.bundleURL scheme];
  if (!host) {
    host = @"localhost";
    scheme = @"http";
  }

  NSNumber *port = [_bridge.bundleURL port];
  if (!port) {
    port = @8081; // Packager default port
  }
  return [NSURL URLWithString:[NSString stringWithFormat:@"%@://%@:%@/message?role=ios-rn-rctdevmenu", scheme, host, port]];
}

- (NSDictionary<NSString *, id<ABI22_0_0RCTPackagerClientMethod>> *)defaultPackagerMethods
{
  return @{
           @"reload": [[ABI22_0_0RCTReloadPackagerMethod alloc] initWithBridge:_bridge],
           @"pokeSamplingProfiler": [[ABI22_0_0RCTSamplingProfilerPackagerMethod alloc] initWithJSEnvironment:_bridge]
           };
}

@end

#endif
