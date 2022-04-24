// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

// Normally we would use RCT_EXTERN_MODULE macro, but in case of this internal module
// we don't want it to be automatically registered for all bridges in the entire app.
@interface DevMenuInternalModule : NSObject

@end

@implementation DevMenuInternalModule (RCTExternModule)

RCT_EXTERN_METHOD(dispatchCallableAsync:(NSString *)callableId args:(NSDictionary *)args resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(fetchDataSourceAsync:(NSString *)dataSourceId resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(hideMenu)
RCT_EXTERN_METHOD(setOnboardingFinished:(BOOL)finished)
RCT_EXTERN_METHOD(openDevMenuFromReactNative)
RCT_EXTERN_METHOD(onScreenChangeAsync:(NSString *)currentScreen resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

RCT_EXPORT_METHOD(copyToClipboardAsync:(NSString *)content
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  UIPasteboard *clipboard = [UIPasteboard generalPasteboard];
  clipboard.string = (content ?: @"");
  resolve(nil);
}

@end
