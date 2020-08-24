// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXAmplitude/EXAmplitude.h>

#import <Amplitude/Amplitude.h>
#import <Amplitude/AMPTrackingOptions.h>

@implementation EXAmplitude

UM_EXPORT_MODULE(ExpoAmplitude);

- (Amplitude *)amplitudeInstance
{
  return [Amplitude instance];
}

UM_EXPORT_METHOD_AS(initialize,
                    initialize:(NSString *)apiKey
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  // TODO: remove the UIApplicationWillEnterForegroundNotification and
  // UIApplicationDidEnterBackgroundNotification observers and call enterForeground
  // and enterBackground manually.
  [[self amplitudeInstance] initializeApiKey:apiKey];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(setUserId,
                    setUserId:(NSString *)userId
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] setUserId:userId];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(setUserProperties,
                    setUserProperties:(NSDictionary *)properties
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] setUserProperties:properties];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(clearUserProperties,
                    clearUserPropertiesWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] clearUserProperties];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(logEvent,
                    logEvent:(NSString *)eventName
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] logEvent:eventName];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(logEventWithProperties,
                    logEventWithProperties:(NSString *)eventName
                    withProperties:(NSDictionary *)properties
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] logEvent:eventName withEventProperties:properties];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(setGroup,
                    setGroup:(NSString *)groupType
                    withGroupNames:(NSArray *)groupNames
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] setGroup:groupType groupName:groupNames];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(setTrackingOptions,
                    setTrackingOptions:(NSDictionary *)options
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
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
