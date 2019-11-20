/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// NOTE: This entire file should be codegen'ed.

#import <vector>

#import <Foundation/Foundation.h>

#import <ABI36_0_0React/ABI36_0_0RCTBridgeModule.h>

#import <ABI36_0_0ReactCommon/ABI36_0_0RCTTurboModule.h>

/**
 * The ObjC protocol based on the JS Flow type for SampleTurboModule.
 */
@protocol NativeSampleTurboModuleSpec <ABI36_0_0RCTBridgeModule, ABI36_0_0RCTTurboModule>

- (void)voidFunc;
- (NSNumber *)getBool:(BOOL)arg;
- (NSNumber *)getNumber:(double)arg;
- (NSString *)getString:(NSString *)arg;
- (NSArray<id<NSObject>> *)getArray:(NSArray *)arg;
- (NSDictionary *)getObject:(NSDictionary *)arg;
- (NSDictionary *)getValue:(double)x y:(NSString *)y z:(NSDictionary *)z;
- (void)getValueWithCallback:(ABI36_0_0RCTResponseSenderBlock)callback;
- (void)getValueWithPromise:(BOOL)error resolve:(ABI36_0_0RCTPromiseResolveBlock)resolve reject:(ABI36_0_0RCTPromiseRejectBlock)reject;
- (NSDictionary *)constantsToExport;
- (NSDictionary *)getConstants;

@end

namespace ABI36_0_0facebook {
namespace ABI36_0_0React {

/**
 * The iOS TurboModule impl specific to SampleTurboModule.
 */
class JSI_EXPORT NativeSampleTurboModuleSpecJSI : public ObjCTurboModule {
 public:
  NativeSampleTurboModuleSpecJSI(id<ABI36_0_0RCTTurboModule> instance, std::shared_ptr<JSCallInvoker> jsInvoker);
};

} // namespace ABI36_0_0React
} // namespace ABI36_0_0facebook
