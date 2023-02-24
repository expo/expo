// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_REMAP_MODULE(ExpoDevMenu, DevMenuModule, NSObject)

+ (BOOL)requiresMainQueueSetup
{
  return true;
}

RCT_EXTERN_METHOD(openMenu)
RCT_EXTERN_METHOD(addDevMenuCallbacks:(NSArray *)names
                  resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
@end
