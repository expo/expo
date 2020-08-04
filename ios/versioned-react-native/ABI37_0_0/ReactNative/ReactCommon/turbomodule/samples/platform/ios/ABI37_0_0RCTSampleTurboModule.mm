/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTSampleTurboModule.h"

#import <UIKit/UIKit.h>

using namespace ABI37_0_0facebook::ABI37_0_0React;

@implementation ABI37_0_0RCTSampleTurboModule

// Backward-compatible export
ABI37_0_0RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;
@synthesize turboModuleLookupDelegate = _turboModuleLookupDelegate;

// Backward-compatible queue configuration
+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (std::shared_ptr<ABI37_0_0facebook::ABI37_0_0React::TurboModule>)getTurboModuleWithJsInvoker:
    (std::shared_ptr<ABI37_0_0facebook::ABI37_0_0React::JSCallInvoker>)jsInvoker
{
  return std::make_shared<NativeSampleTurboModuleSpecJSI>(self, jsInvoker);
}

// Backward compatible invalidation
- (void)invalidate
{
  // Actually do nothing here.
  NSLog(@"Invalidating ABI37_0_0RCTSampleTurboModule...");
}

- (NSDictionary *)getConstants
{
  UIScreen *mainScreen = UIScreen.mainScreen;
  CGSize screenSize = mainScreen.bounds.size;

  return @{
    @"const1" : @YES,
    @"const2" : @(screenSize.width),
    @"const3" : @"something",
  };
}

// TODO: Remove once fully migrated to TurboModule.
- (NSDictionary *)constantsToExport
{
  return [self getConstants];
}

ABI37_0_0RCT_EXPORT_METHOD(voidFunc)
{
  // Nothing to do
}

ABI37_0_0RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, getBool : (BOOL)arg)
{
  return @(arg);
}

ABI37_0_0RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSNumber *, getNumber : (double)arg)
{
  return @(arg);
}

ABI37_0_0RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSString *, getString : (NSString *)arg)
{
  return arg;
}

ABI37_0_0RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSArray<id<NSObject>> *, getArray : (NSArray *)arg)
{
  return arg;
}

ABI37_0_0RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSDictionary *, getObject : (NSDictionary *)arg)
{
  return arg;
}

ABI37_0_0RCT_EXPORT_SYNCHRONOUS_TYPED_METHOD(NSDictionary *, getValue : (double)x y : (NSString *)y z : (NSDictionary *)z)
{
  return @{
    @"x" : @(x),
    @"y" : y ?: [NSNull null],
    @"z" : z ?: [NSNull null],
  };
}

ABI37_0_0RCT_EXPORT_METHOD(getValueWithCallback : (ABI37_0_0RCTResponseSenderBlock)callback)
{
  if (!callback) {
    return;
  }
  callback(@[ @"value from callback!" ]);
}

ABI37_0_0RCT_EXPORT_METHOD(getValueWithPromise
                  : (BOOL)error resolve
                  : (ABI37_0_0RCTPromiseResolveBlock)resolve reject
                  : (ABI37_0_0RCTPromiseRejectBlock)reject)
{
  if (!resolve || !reject) {
    return;
  }

  if (error) {
    reject(
        @"code_1",
        @"intentional promise rejection",
        [NSError errorWithDomain:@"ABI37_0_0RCTSampleTurboModule" code:1 userInfo:nil]);
  } else {
    resolve(@"result!");
  }
}

@end
