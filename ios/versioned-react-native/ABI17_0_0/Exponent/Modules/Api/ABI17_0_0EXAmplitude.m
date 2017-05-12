// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI17_0_0EXAmplitude.h"

#import <Amplitude.h>
#import "ABI17_0_0EXVersionManager.h"
#import "ABI17_0_0EXScope.h"

@interface ABI17_0_0EXAmplitude ()

@property (nonatomic, strong) NSString *escapedExperienceId;

@end

@implementation ABI17_0_0EXAmplitude

ABI17_0_0RCT_EXPORT_MODULE(ExponentAmplitude);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI17_0_0RCTBridge *)bridge
{
  _bridge = bridge;
  _escapedExperienceId = [ABI17_0_0EXVersionManager escapedResourceName:_bridge.experienceScope.experienceId];
}

ABI17_0_0RCT_EXPORT_METHOD(initialize:(NSString *)apiKey)
{
  // TODO: remove the UIApplicationWillEnterForegroundNotification and
  // UIApplicationDidEnterBackgroundNotification observers and call enterForeground
  // and enterBackground manually.
  [[Amplitude instanceWithName:_escapedExperienceId] initializeApiKey:apiKey];
}

ABI17_0_0RCT_EXPORT_METHOD(setUserId:(NSString *)userId)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setUserId:userId];
}

ABI17_0_0RCT_EXPORT_METHOD(setUserProperties:(NSDictionary *)properties)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setUserProperties:properties];
}

ABI17_0_0RCT_EXPORT_METHOD(clearUserProperties)
{
  [[Amplitude instanceWithName:_escapedExperienceId] clearUserProperties];
}

ABI17_0_0RCT_EXPORT_METHOD(logEvent:(NSString *)eventName)
{
  [[Amplitude instanceWithName:_escapedExperienceId] logEvent:eventName];
}

ABI17_0_0RCT_EXPORT_METHOD(logEventWithProperties:(NSString *)eventName withProperties:(NSDictionary *)properties)
{
  [[Amplitude instanceWithName:_escapedExperienceId] logEvent:eventName withEventProperties:properties];
}

ABI17_0_0RCT_EXPORT_METHOD(setGroup:(NSString *)groupType withGroupNames:(NSArray *)groupNames)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setGroup:groupType groupName:groupNames];
}

@end
