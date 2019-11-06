// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXAdsAdMob/EXAdsAdMob.h>
#import <EXAdsAdMob/EXAdsAdMobUtils.h>

@implementation EXAdsAdMob

UM_EXPORT_MODULE(ExpoAdsAdMob);

UM_EXPORT_METHOD_AS(setTestDeviceID,
                    setTestDeviceID:(NSString *)testDeviceID
                    resolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [EXAdsAdMobUtils setGlobalTestDeviceIdentifier:testDeviceID];
  resolve(nil);
}

@end
