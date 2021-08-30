// Copyright 2019-present 650 Industries. All rights reserved.

#import <EXAdsAdMob/EXAdsAdMob.h>
#import <EXAdsAdMob/EXAdsAdMobAppTrackingPermissionRequester.h>

#import <GoogleMobileAds/GoogleMobileAds.h>

#import <ExpoModulesCore/EXPermissionsInterface.h>
#import <ExpoModulesCore/EXPermissionsMethodsDelegate.h>

@interface EXAdsAdMob ()

@property (nonatomic, weak) id<EXPermissionsInterface> permissionsManager;

@end

@implementation EXAdsAdMob

EX_EXPORT_MODULE(ExpoAdsAdMob);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXPermissionsInterface)];
  [EXPermissionsMethodsDelegate registerRequesters:@[[EXAdsAdMobAppTrackingPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

EX_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[EXAdsAdMobAppTrackingPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[EXAdsAdMobAppTrackingPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

EX_EXPORT_METHOD_AS(setTestDeviceIDAsync,
                    setTestDeviceID:(NSString *)testDeviceID
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
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
