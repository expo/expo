// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(ExpoDevMenu, DevMenuModule, NSObject)

+ (BOOL)requiresMainQueueSetup
{
  return true;
}

RCT_EXTERN_METHOD(openMenu)
RCT_EXTERN_METHOD(openProfile)
RCT_EXTERN_METHOD(openSettings)

RCT_EXTERN_METHOD(isLoggedInAsync:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(queryDevSessionsAsync:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(queryUpdateChannels:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(queryUpdateBranches:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

@end
