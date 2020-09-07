/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI39_0_0RCTSourceCode.h"

#import <ABI39_0_0FBReactNativeSpec/ABI39_0_0FBReactNativeSpec.h>

#import <ABI39_0_0React/ABI39_0_0RCTBridge.h>

#import "ABI39_0_0CoreModulesPlugins.h"

using namespace ABI39_0_0facebook::ABI39_0_0React;

@interface ABI39_0_0RCTSourceCode () <ABI39_0_0NativeSourceCodeSpec>
@end

@implementation ABI39_0_0RCTSourceCode

ABI39_0_0RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

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
    @"scriptURL" : self.bridge.bundleURL.absoluteString ?: @"",
  };
}

- (std::shared_ptr<TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<CallInvoker>)jsInvoker
                                              nativeInvoker:(std::shared_ptr<CallInvoker>)nativeInvoker
                                                 perfLogger:(id<ABI39_0_0RCTTurboModulePerformanceLogger>)perfLogger
{
  return std::make_shared<NativeSourceCodeSpecJSI>(self, jsInvoker, nativeInvoker, perfLogger);
}

@end

Class ABI39_0_0RCTSourceCodeCls(void)
{
  return ABI39_0_0RCTSourceCode.class;
}
