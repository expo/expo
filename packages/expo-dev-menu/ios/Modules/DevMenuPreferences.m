// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(DevMenuPreferences, NSObject)

RCT_EXTERN_METHOD(getPreferencesAsync:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(setPreferencesAsync:(NSDictionary *)settings resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

@end
