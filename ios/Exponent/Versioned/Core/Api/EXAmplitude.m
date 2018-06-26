// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAmplitude.h"
#import "EXModuleRegistryBinding.h"
#import "EXUtil.h"

#import <EXConstantsInterface/EXConstantsInterface.h>
#import <Amplitude.h>

@interface EXAmplitude ()

@property (nonatomic, strong) NSString *escapedExperienceId;

@end

@implementation EXAmplitude

RCT_EXPORT_MODULE(ExponentAmplitude);

@synthesize bridge = _bridge;

- (void)setBridge:(RCTBridge *)bridge
{
  id<EXConstantsInterface> constants = [bridge.scopedModules.moduleRegistry getModuleImplementingProtocol:@protocol(EXConstantsInterface)];
  
  _bridge = bridge;
  _escapedExperienceId = [EXUtil escapedResourceName:[constants experienceId]];
}

RCT_EXPORT_METHOD(initialize:(NSString *)apiKey)
{
  // TODO: remove the UIApplicationWillEnterForegroundNotification and
  // UIApplicationDidEnterBackgroundNotification observers and call enterForeground
  // and enterBackground manually.
  [[Amplitude instanceWithName:_escapedExperienceId] initializeApiKey:apiKey];
}

RCT_EXPORT_METHOD(setUserId:(NSString *)userId)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setUserId:userId];
}

RCT_EXPORT_METHOD(setUserProperties:(NSDictionary *)properties)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setUserProperties:properties];
}

RCT_EXPORT_METHOD(clearUserProperties)
{
  [[Amplitude instanceWithName:_escapedExperienceId] clearUserProperties];
}

RCT_EXPORT_METHOD(logEvent:(NSString *)eventName)
{
  [[Amplitude instanceWithName:_escapedExperienceId] logEvent:eventName];
}

RCT_EXPORT_METHOD(logEventWithProperties:(NSString *)eventName withProperties:(NSDictionary *)properties)
{
  [[Amplitude instanceWithName:_escapedExperienceId] logEvent:eventName withEventProperties:properties];
}

RCT_EXPORT_METHOD(setGroup:(NSString *)groupType withGroupNames:(NSArray *)groupNames)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setGroup:groupType groupName:groupNames];
}

@end
