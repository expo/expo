// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI25_0_0EXAmplitude.h"

#import "ABI25_0_0EXConstants.h"
#import "ABI25_0_0EXUtil.h"

#import <Amplitude.h>

@interface ABI25_0_0EXAmplitude ()

@property (nonatomic, strong) NSString *escapedExperienceId;

@end

@implementation ABI25_0_0EXAmplitude

ABI25_0_0RCT_EXPORT_MODULE(ExponentAmplitude);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI25_0_0RCTBridge *)bridge
{
  _bridge = bridge;
  _escapedExperienceId = [ABI25_0_0EXUtil escapedResourceName:_bridge.scopedModules.constants.experienceId];
}

ABI25_0_0RCT_EXPORT_METHOD(initialize:(NSString *)apiKey)
{
  // TODO: remove the UIApplicationWillEnterForegroundNotification and
  // UIApplicationDidEnterBackgroundNotification observers and call enterForeground
  // and enterBackground manually.
  [[Amplitude instanceWithName:_escapedExperienceId] initializeApiKey:apiKey];
}

ABI25_0_0RCT_EXPORT_METHOD(setUserId:(NSString *)userId)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setUserId:userId];
}

ABI25_0_0RCT_EXPORT_METHOD(setUserProperties:(NSDictionary *)properties)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setUserProperties:properties];
}

ABI25_0_0RCT_EXPORT_METHOD(clearUserProperties)
{
  [[Amplitude instanceWithName:_escapedExperienceId] clearUserProperties];
}

ABI25_0_0RCT_EXPORT_METHOD(logEvent:(NSString *)eventName)
{
  [[Amplitude instanceWithName:_escapedExperienceId] logEvent:eventName];
}

ABI25_0_0RCT_EXPORT_METHOD(logEventWithProperties:(NSString *)eventName withProperties:(NSDictionary *)properties)
{
  [[Amplitude instanceWithName:_escapedExperienceId] logEvent:eventName withEventProperties:properties];
}

ABI25_0_0RCT_EXPORT_METHOD(setGroup:(NSString *)groupType withGroupNames:(NSArray *)groupNames)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setGroup:groupType groupName:groupNames];
}

@end
