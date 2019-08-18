// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI32_0_0EXAmplitude.h"
#import "ABI32_0_0EXModuleRegistryBinding.h"
#import "ABI32_0_0EXUtil.h"

#import <ABI32_0_0EXConstantsInterface/ABI32_0_0EXConstantsInterface.h>
#import <Amplitude.h>

@interface ABI32_0_0EXAmplitude ()

@property (nonatomic, strong) NSString *escapedExperienceId;

@end

@implementation ABI32_0_0EXAmplitude

ABI32_0_0RCT_EXPORT_MODULE(ExponentAmplitude);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI32_0_0RCTBridge *)bridge
{
  id<ABI32_0_0EXConstantsInterface> constants = [bridge.scopedModules.moduleRegistry getModuleImplementingProtocol:@protocol(ABI32_0_0EXConstantsInterface)];
  
  _bridge = bridge;
  _escapedExperienceId = [ABI32_0_0EXUtil escapedResourceName:[constants experienceId]];
}

ABI32_0_0RCT_EXPORT_METHOD(initialize:(NSString *)apiKey)
{
  // TODO: remove the UIApplicationWillEnterForegroundNotification and
  // UIApplicationDidEnterBackgroundNotification observers and call enterForeground
  // and enterBackground manually.
  [[Amplitude instanceWithName:_escapedExperienceId] initializeApiKey:apiKey];
}

ABI32_0_0RCT_EXPORT_METHOD(setUserId:(NSString *)userId)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setUserId:userId];
}

ABI32_0_0RCT_EXPORT_METHOD(setUserProperties:(NSDictionary *)properties)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setUserProperties:properties];
}

ABI32_0_0RCT_EXPORT_METHOD(clearUserProperties)
{
  [[Amplitude instanceWithName:_escapedExperienceId] clearUserProperties];
}

ABI32_0_0RCT_EXPORT_METHOD(logEvent:(NSString *)eventName)
{
  [[Amplitude instanceWithName:_escapedExperienceId] logEvent:eventName];
}

ABI32_0_0RCT_EXPORT_METHOD(logEventWithProperties:(NSString *)eventName withProperties:(NSDictionary *)properties)
{
  [[Amplitude instanceWithName:_escapedExperienceId] logEvent:eventName withEventProperties:properties];
}

ABI32_0_0RCT_EXPORT_METHOD(setGroup:(NSString *)groupType withGroupNames:(NSArray *)groupNames)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setGroup:groupType groupName:groupNames];
}

@end
