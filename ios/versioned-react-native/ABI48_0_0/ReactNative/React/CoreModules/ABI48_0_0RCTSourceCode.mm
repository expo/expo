/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTSourceCode.h"

#import <ABI48_0_0FBReactNativeSpec/ABI48_0_0FBReactNativeSpec.h>

#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>

#import "ABI48_0_0CoreModulesPlugins.h"

using namespace ABI48_0_0facebook::ABI48_0_0React;

@interface ABI48_0_0RCTSourceCode () <ABI48_0_0NativeSourceCodeSpec>
@end

@implementation ABI48_0_0RCTSourceCode

ABI48_0_0RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;
@synthesize bundleManager = _bundleManager;

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary<NSString *, id> *)getConstants
{
  return @{
    @"scriptURL" : self.bundleManager.bundleURL.absoluteString ?: @"",
  };
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeSourceCodeSpecJSI>(params);
}

@end

Class ABI48_0_0RCTSourceCodeCls(void)
{
  return ABI48_0_0RCTSourceCode.class;
}
