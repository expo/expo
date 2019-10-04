// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXAmplitude/EXAmplitude.h>

#import <Amplitude-iOS/Amplitude.h>
#import <Amplitude-iOS/AMPTrackingOptions.h>

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
  
  if ([options objectForKey:@"disableCarrier"]) {
    [trackingOptions disableCarrier];
  }
  if ([options objectForKey:@"disableCity"]) {
    [trackingOptions disableCity];
  }
  if ([options objectForKey:@"disableCountry"]) {
    [trackingOptions disableCountry];
  }
  if ([options objectForKey:@"disableDeviceModel"]) {
    [trackingOptions disableDeviceModel];
  }
  if ([options objectForKey:@"disableDMA"]) {
    [trackingOptions disableDMA];
  }
  if ([options objectForKey:@"disableIDFA"]) {
    [trackingOptions disableIDFA];
  }
  if ([options objectForKey:@"disableIDFV"]) {
    [trackingOptions disableIDFV];
  }
  if ([options objectForKey:@"disableIPAddress"]) {
    [trackingOptions disableIPAddress];
  }
  if ([options objectForKey:@"disableLanguage"]) {
    [trackingOptions disableLanguage];
  }
  if ([options objectForKey:@"disableLatLng"]) {
    [trackingOptions disableLatLng];
  }
  if ([options objectForKey:@"disableOSName"]) {
    [trackingOptions disableOSName];
  }
  if ([options objectForKey:@"disableOSVersion"]) {
    [trackingOptions disableOSVersion];
  }
  if ([options objectForKey:@"disablePlatform"]) {
    [trackingOptions disablePlatform];
  }
  if ([options objectForKey:@"disableRegion"]) {
    [trackingOptions disableRegion];
  }
  if ([options objectForKey:@"disableVersionName"]) {
    [trackingOptions disableVersionName];
  }

  [[self amplitudeInstance] setTrackingOptions:trackingOptions];
  resolve(nil);
}

@end
