// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

// Normally we would use RCT_EXTERN_MODULE macro, but in case of this internal module
// we don't want it to be automatically registered for all bridges in the entire app.
@interface DevMenuInternalModule : NSObject
@end

@implementation DevMenuInternalModule (RCTExternModule)

RCT_EXTERN_METHOD(dispatchActionAsync:(NSString *)actionId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(hideMenu)
RCT_EXTERN_METHOD(setOnboardingFinished:(BOOL)finished)
RCT_EXTERN_METHOD(getSettingsAsync:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(setSettingsAsync:(NSDictionary *)dict resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

@end
