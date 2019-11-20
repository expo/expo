// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI34_0_0EXAmplitude/ABI34_0_0EXAmplitude.h>

#import <Amplitude-iOS/Amplitude.h>

@implementation ABI34_0_0EXAmplitude

ABI34_0_0UM_EXPORT_MODULE(ExpoAmplitude);

- (Amplitude *)amplitudeInstance
{
  return [Amplitude instance];
}

ABI34_0_0UM_EXPORT_METHOD_AS(initialize,
                    initialize:(NSString *)apiKey
                    resolve:(ABI34_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  // TODO: remove the UIApplicationWillEnterForegroundNotification and
  // UIApplicationDidEnterBackgroundNotification observers and call enterForeground
  // and enterBackground manually.
  [[self amplitudeInstance] initializeApiKey:apiKey];
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(setUserId,
                    setUserId:(NSString *)userId
                    resolve:(ABI34_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] setUserId:userId];
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(setUserProperties,
                    setUserProperties:(NSDictionary *)properties
                    resolve:(ABI34_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] setUserProperties:properties];
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(clearUserProperties,
                    clearUserPropertiesWithResolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] clearUserProperties];
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(logEvent,
                    logEvent:(NSString *)eventName
                    resolve:(ABI34_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] logEvent:eventName];
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(logEventWithProperties,
                    logEventWithProperties:(NSString *)eventName
                    withProperties:(NSDictionary *)properties
                    resolve:(ABI34_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] logEvent:eventName withEventProperties:properties];
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(setGroup,
                    setGroup:(NSString *)groupType
                    withGroupNames:(NSArray *)groupNames
                    resolve:(ABI34_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  [[self amplitudeInstance] setGroup:groupType groupName:groupNames];
  resolve(nil);
}

@end
