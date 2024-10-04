/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// NOTE: This entire file should be codegen'ed.

#import <vector>

#import <Foundation/Foundation.h>

#import <ABI42_0_0React/ABI42_0_0RCTBridgeModule.h>

#import <ABI42_0_0ReactCommon/ABI42_0_0RCTTurboModule.h>

/**
 * The ObjC protocol based on the JS Flow type for SampleTurboModule.
 */
@protocol ABI42_0_0NativeSampleTurboModuleSpec <ABI42_0_0RCTBridgeModule, ABI42_0_0RCTTurboModule>

- (void)voidFunc;
- (NSNumber *)getBool:(BOOL)arg;
- (NSNumber *)getNumber:(double)arg;
- (NSString *)getString:(NSString *)arg;
- (NSArray<id<NSObject>> *)getArray:(NSArray *)arg;
- (NSDictionary *)getObject:(NSDictionary *)arg;
- (NSDictionary *)getValue:(double)x y:(NSString *)y z:(NSDictionary *)z;
- (void)getValueWithCallback:(ABI42_0_0RCTResponseSenderBlock)callback;
- (void)getValueWithPromise:(BOOL)error resolve:(ABI42_0_0RCTPromiseResolveBlock)resolve reject:(ABI42_0_0RCTPromiseRejectBlock)reject;
- (NSDictionary *)constantsToExport;
- (NSDictionary *)getConstants;

@end

namespace ABI42_0_0facebook {
namespace ABI42_0_0React {

/**
 * The iOS TurboModule impl specific to SampleTurboModule.
 */
class JSI_EXPORT NativeSampleTurboModuleSpecJSI : public ObjCTurboModule {
 public:
  NativeSampleTurboModuleSpecJSI(
      id<ABI42_0_0RCTTurboModule> instance,
      std::shared_ptr<CallInvoker> jsInvoker,
      std::shared_ptr<CallInvoker> nativeInvoker,
      id<ABI42_0_0RCTTurboModulePerformanceLogger> perfLogger);
};

} // namespace ABI42_0_0React
} // namespace ABI42_0_0facebook
