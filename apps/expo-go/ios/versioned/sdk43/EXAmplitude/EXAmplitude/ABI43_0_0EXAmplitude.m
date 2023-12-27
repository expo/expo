// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXAmplitude/ABI43_0_0EXAmplitude.h>

#import <Amplitude/Amplitude.h>
#import <Amplitude/AMPTrackingOptions.h>

@implementation ABI43_0_0EXAmplitude

ABI43_0_0EX_EXPORT_MODULE(ExpoAmplitude);

- (Amplitude *)amplitudeInstance
{
  return [Amplitude instance];
}

ABI43_0_0EX_EXPORT_METHOD_AS(initializeAsync,
                    initializeAsync:(NSString *)apiKey
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  // TODO: remove the UIApplicationWillEnterForegroundNotification and
  // UIApplicationDidEnterBackgroundNotification observers and call enterForeground
  // and enterBackground manually.
  [[self amplitudeInstance] initializeApiKey:apiKey];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(setUserIdAsync,
                    setUserIdAsync:(NSString *)userId
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] setUserId:userId];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(setUserPropertiesAsync,
                    setUserPropertiesAsync:(NSDictionary *)properties
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] setUserProperties:properties];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(clearUserPropertiesAsync,
                    clearUserPropertiesAsyncWithResolver:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] clearUserProperties];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(logEventAsync,
                    logEventAsync:(NSString *)eventName
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] logEvent:eventName];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(logEventWithPropertiesAsync,
                    logEventWithPropertiesAsync:(NSString *)eventName
                    withProperties:(NSDictionary *)properties
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] logEvent:eventName withEventProperties:properties];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(setGroupAsync,
                    setGroupAsync:(NSString *)groupType
                    withGroupNames:(NSArray *)groupNames
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] setGroup:groupType groupName:groupNames];
  resolve(nil);
}

ABI43_0_0EX_EXPORT_METHOD_AS(setTrackingOptionsAsync,
                    setTrackingOptionsAsync:(NSDictionary *)options
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  AMPTrackingOptions *trackingOptions = [AMPTrackingOptions options];
  
  if ([options[@"disableCarrier"] boolValue]) {
    [trackingOptions disableCarrier];
  }
  if ([options[@"disableCity"] boolValue]) {
    [trackingOptions disableCity];
  }
  if ([options[@"disableCountry"] boolValue]) {
    [trackingOptions disableCountry];
  }
  if ([options[@"disableDeviceModel"] boolValue]) {
    [trackingOptions disableDeviceModel];
  }
  if ([options[@"disableDMA"] boolValue]) {
    [trackingOptions disableDMA];
  }
  if ([options[@"disableIDFV"] boolValue]) {
    [trackingOptions disableIDFV];
  }
  if ([options[@"disableIPAddress"] boolValue]) {
    [trackingOptions disableIPAddress];
  }
  if ([options[@"disableLanguage"] boolValue]) {
    [trackingOptions disableLanguage];
  }
  if ([options[@"disableLatLng"] boolValue]) {
    [trackingOptions disableLatLng];
  }
  if ([options[@"disableOSName"] boolValue]) {
    [trackingOptions disableOSName];
  }
  if ([options[@"disableOSVersion"] boolValue]) {
    [trackingOptions disableOSVersion];
  }
  if ([options[@"disablePlatform"] boolValue]) {
    [trackingOptions disablePlatform];
  }
  if ([options[@"disableRegion"] boolValue]) {
    [trackingOptions disableRegion];
  }
  if ([options[@"disableVersionName"] boolValue]) {
    [trackingOptions disableVersionName];
  }

  [[self amplitudeInstance] setTrackingOptions:trackingOptions];
  resolve(nil);
}

@end
