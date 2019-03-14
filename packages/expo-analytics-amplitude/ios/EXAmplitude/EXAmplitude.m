// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXAmplitude/EXAmplitude.h>

#import <UMConstantsInterface/UMConstantsInterface.h>
#import <Amplitude-iOS/Amplitude.h>

@interface EXAmplitude ()

@property (nonatomic, strong) NSString *escapedExperienceId;

@end

@implementation EXAmplitude

UM_EXPORT_MODULE(ExpoAmplitude);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  id<UMConstantsInterface> constants = [moduleRegistry getModuleImplementingProtocol:@protocol(UMConstantsInterface)];
  _escapedExperienceId = [self escapedExperienceId:constants.experienceId];
}

UM_EXPORT_METHOD_AS(initialize,
                    initialize:(NSString *)apiKey
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  // TODO: remove the UIApplicationWillEnterForegroundNotification and
  // UIApplicationDidEnterBackgroundNotification observers and call enterForeground
  // and enterBackground manually.
  [[Amplitude instanceWithName:_escapedExperienceId] initializeApiKey:apiKey];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(setUserId,
                    setUserId:(NSString *)userId
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setUserId:userId];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(setUserProperties,
                    setUserProperties:(NSDictionary *)properties
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setUserProperties:properties];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(clearUserProperties,
                    clearUserPropertiesWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [[Amplitude instanceWithName:_escapedExperienceId] clearUserProperties];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(logEvent,
                    logEvent:(NSString *)eventName
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  [[Amplitude instanceWithName:_escapedExperienceId] logEvent:eventName];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(logEventWithProperties,
                    logEventWithProperties:(NSString *)eventName
                    withProperties:(NSDictionary *)properties
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  [[Amplitude instanceWithName:_escapedExperienceId] logEvent:eventName withEventProperties:properties];
  resolve(nil);
}

UM_EXPORT_METHOD_AS(setGroup,
                    setGroup:(NSString *)groupType
                    withGroupNames:(NSArray *)groupNames
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setGroup:groupType groupName:groupNames];
  resolve(nil);
}

- (NSString *)escapedExperienceId:(NSString *)experienceId
{
  NSString *charactersToEscape = @"!*'();:@&=+$,/?%#[]";
  NSCharacterSet *allowedCharacters = [[NSCharacterSet characterSetWithCharactersInString:charactersToEscape] invertedSet];
  return [experienceId stringByAddingPercentEncodingWithAllowedCharacters:allowedCharacters];
}

@end
