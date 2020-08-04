// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXAmplitude/ABI37_0_0EXAmplitude.h>

#import <Amplitude-iOS/Amplitude.h>
#import <Amplitude-iOS/AMPTrackingOptions.h>

@implementation ABI37_0_0EXAmplitude

ABI37_0_0UM_EXPORT_MODULE(ExpoAmplitude);

- (Amplitude *)amplitudeInstance
{
  return [Amplitude instance];
}

ABI37_0_0UM_EXPORT_METHOD_AS(initialize,
                    initialize:(NSString *)apiKey
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  // TODO: remove the UIApplicationWillEnterForegroundNotification and
  // UIApplicationDidEnterBackgroundNotification observers and call enterForeground
  // and enterBackground manually.
  [[self amplitudeInstance] initializeApiKey:apiKey];
  resolve(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(setUserId,
                    setUserId:(NSString *)userId
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] setUserId:userId];
  resolve(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(setUserProperties,
                    setUserProperties:(NSDictionary *)properties
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] setUserProperties:properties];
  resolve(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(clearUserProperties,
                    clearUserPropertiesWithResolver:(ABI37_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] clearUserProperties];
  resolve(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(logEvent,
                    logEvent:(NSString *)eventName
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] logEvent:eventName];
  resolve(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(logEventWithProperties,
                    logEventWithProperties:(NSString *)eventName
                    withProperties:(NSDictionary *)properties
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] logEvent:eventName withEventProperties:properties];
  resolve(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(setGroup,
                    setGroup:(NSString *)groupType
                    withGroupNames:(NSArray *)groupNames
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] setGroup:groupType groupName:groupNames];
  resolve(nil);
}

ABI37_0_0UM_EXPORT_METHOD_AS(setTrackingOptions,
                    setTrackingOptions:(NSDictionary *)options
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
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
  if ([options[@"disableIDFA"] boolValue]) {
    [trackingOptions disableIDFA];
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
