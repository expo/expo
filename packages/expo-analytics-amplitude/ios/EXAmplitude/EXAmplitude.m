// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXAmplitude/EXAmplitude.h>

#import <EXConstantsInterface/EXConstantsInterface.h>
#import <Amplitude-iOS/Amplitude.h>

@interface EXAmplitude ()

@property (nonatomic, strong) NSString *escapedExperienceId;

@end

@implementation EXAmplitude

EX_EXPORT_MODULE(ExpoAmplitude);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  id<EXConstantsInterface> constants = [moduleRegistry getModuleImplementingProtocol:@protocol(EXConstantsInterface)];
  _escapedExperienceId = [self escapedExperienceId:constants.experienceId];
}

EX_EXPORT_METHOD_AS(initialize,
                    initialize:(NSString *)apiKey
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  // TODO: remove the UIApplicationWillEnterForegroundNotification and
  // UIApplicationDidEnterBackgroundNotification observers and call enterForeground
  // and enterBackground manually.
  [[Amplitude instanceWithName:_escapedExperienceId] initializeApiKey:apiKey];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(setUserId,
                    setUserId:(NSString *)userId
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setUserId:userId];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(setUserProperties,
                    setUserProperties:(NSDictionary *)properties
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setUserProperties:properties];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(clearUserProperties,
                    clearUserPropertiesWithResolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [[Amplitude instanceWithName:_escapedExperienceId] clearUserProperties];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(logEvent,
                    logEvent:(NSString *)eventName
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [[Amplitude instanceWithName:_escapedExperienceId] logEvent:eventName];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(logEventWithProperties,
                    logEventWithProperties:(NSString *)eventName
                    withProperties:(NSDictionary *)properties
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
  [[Amplitude instanceWithName:_escapedExperienceId] logEvent:eventName withEventProperties:properties];
  resolve(nil);
}

EX_EXPORT_METHOD_AS(setGroup,
                    setGroup:(NSString *)groupType
                    withGroupNames:(NSArray *)groupNames
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
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
