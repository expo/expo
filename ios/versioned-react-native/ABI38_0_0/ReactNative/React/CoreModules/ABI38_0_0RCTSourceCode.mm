/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTSourceCode.h"

#import <ABI38_0_0FBReactNativeSpec/ABI38_0_0FBReactNativeSpec.h>

#import <ABI38_0_0React/ABI38_0_0RCTBridge.h>

#import "ABI38_0_0CoreModulesPlugins.h"

using namespace ABI38_0_0facebook::ABI38_0_0React;

@interface ABI38_0_0RCTSourceCode () <NativeSourceCodeSpec>
@end

@implementation ABI38_0_0RCTSourceCode

ABI38_0_0RCT_EXPORT_MODULE()

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
    @"scriptURL": self.bridge.bundleURL.absoluteString ?: @"",
  };
}

- (std::shared_ptr<TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<CallInvoker>)jsInvoker
{
  return std::make_shared<NativeSourceCodeSpecJSI>(self, jsInvoker);
}

@end

Class ABI38_0_0RCTSourceCodeCls(void) {
  return ABI38_0_0RCTSourceCode.class;
}
