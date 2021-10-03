// Copyright 2019-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXAdsAdMob/ABI43_0_0EXAdsAdMob.h>
#import <ABI43_0_0EXAdsAdMob/ABI43_0_0EXAdsAdMobAppTrackingPermissionRequester.h>

#import <GoogleMobileAds/GoogleMobileAds.h>

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXPermissionsInterface.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXPermissionsMethodsDelegate.h>

@interface ABI43_0_0EXAdsAdMob ()

@property (nonatomic, weak) id<ABI43_0_0EXPermissionsInterface> permissionsManager;

@end

@implementation ABI43_0_0EXAdsAdMob

ABI43_0_0EX_EXPORT_MODULE(ExpoAdsAdMob);

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXPermissionsInterface)];
  [ABI43_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI43_0_0EXAdsAdMobAppTrackingPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

ABI43_0_0EX_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI43_0_0EXAdsAdMobAppTrackingPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI43_0_0EXAdsAdMobAppTrackingPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(setTestDeviceIDAsync,
                    setTestDeviceID:(NSString *)testDeviceID
                    resolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  NSArray<NSString *>* testDeviceIdentifiers = nil;
  if (testDeviceID && ![testDeviceID isEqualToString:@""]) {
    if ([testDeviceID isEqualToString:@"EMULATOR"]) {
      testDeviceIdentifiers = @[kGADSimulatorID];
    } else {
      testDeviceIdentifiers = @[testDeviceID];
    }
  }
  GADMobileAds.sharedInstance.requestConfiguration.testDeviceIdentifiers = testDeviceIdentifiers;
  resolve(nil);
}

@end
