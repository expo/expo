/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI24_0_0RCTPackagerConnectionBridgeConfig.h"

#import <objc/runtime.h>

#import <ReactABI24_0_0/ABI24_0_0RCTBridge.h>
#import <ReactABI24_0_0/ABI24_0_0RCTBundleURLProvider.h>

#import "ABI24_0_0RCTJSEnvironment.h"
#import "ABI24_0_0RCTReloadPackagerMethod.h"
#import "ABI24_0_0RCTSamplingProfilerPackagerMethod.h"

#if ABI24_0_0RCT_DEV // Only supported in dev mode

@implementation ABI24_0_0RCTPackagerConnectionBridgeConfig {
  id<ABI24_0_0RCTJSEnvironment> _jsEnvironment;
  ABI24_0_0RCTReloadPackagerMethodBlock _reloadCommand;
  NSURL *_sourceURL;
}

- (instancetype)initWithBridge:(ABI24_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _jsEnvironment = bridge;
    _sourceURL = [bridge.bundleURL copy];
    __weak ABI24_0_0RCTBridge *weakBridge = bridge;
    _reloadCommand = ^(id params) {
      if (params != (id)kCFNull && [params[@"debug"] boolValue]) {
        weakBridge.executorClass = objc_lookUpClass("ABI24_0_0RCTWebSocketExecutor");
      }
      [weakBridge reload];
    };
  }
  return self;
}

- (NSURL *)packagerURL
{
  NSURLComponents *components = [NSURLComponents new];
  NSString *host = [_sourceURL host];
  components.host = host ?: @"localhost";
  components.scheme = host ? [_sourceURL scheme] : @"http";
  components.port = [_sourceURL port] ?: @(kABI24_0_0RCTBundleURLProviderDefaultPort);
  components.path = @"/message";
  components.queryItems = @[[NSURLQueryItem queryItemWithName:@"role" value:@"ios-rn-rctdevmenu"]];
  return components.URL;
}

- (NSDictionary<NSString *, id<ABI24_0_0RCTPackagerClientMethod>> *)defaultPackagerMethods
{
  return @{
           @"reload": [[ABI24_0_0RCTReloadPackagerMethod alloc] initWithReloadCommand:_reloadCommand callbackQueue:dispatch_get_main_queue()],
           @"pokeSamplingProfiler": [[ABI24_0_0RCTSamplingProfilerPackagerMethod alloc] initWithJSEnvironment:_jsEnvironment]
           };
}

@end

#endif
