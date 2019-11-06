// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXAdsAdMob/EXAdsAdMobUtils.h>
#import <GoogleMobileAds/GoogleMobileAds.h>

@implementation EXAdsAdMobUtils

+ (void)setGlobalTestDeviceIdentifier:(NSString *)testDeviceID {
  NSArray<NSString *>* testDeviceIdentifiers = nil;
  if (testDeviceID && ![testDeviceID isEqualToString:@""]) {
    if ([testDeviceID isEqualToString:@"EMULATOR"]) {
      testDeviceIdentifiers = @[kGADSimulatorID];
    } else {
      testDeviceIdentifiers = @[testDeviceID];
    }
  }
  GADMobileAds.sharedInstance.requestConfiguration.testDeviceIdentifiers = testDeviceIdentifiers;
}

@end
