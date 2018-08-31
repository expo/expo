// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI30_0_0EXAmplitude.h"
#import "ABI30_0_0EXModuleRegistryBinding.h"
#import "ABI30_0_0EXUtil.h"

#import <ABI30_0_0EXConstantsInterface/ABI30_0_0EXConstantsInterface.h>
#import <Amplitude.h>

@interface ABI30_0_0EXAmplitude ()

@property (nonatomic, strong) NSString *escapedExperienceId;

@end

@implementation ABI30_0_0EXAmplitude

ABI30_0_0RCT_EXPORT_MODULE(ExponentAmplitude);

@synthesize bridge = _bridge;

- (void)setBridge:(ABI30_0_0RCTBridge *)bridge
{
  id<ABI30_0_0EXConstantsInterface> constants = [bridge.scopedModules.moduleRegistry getModuleImplementingProtocol:@protocol(ABI30_0_0EXConstantsInterface)];
  
  _bridge = bridge;
  _escapedExperienceId = [ABI30_0_0EXUtil escapedResourceName:[constants experienceId]];
}

ABI30_0_0RCT_EXPORT_METHOD(initialize:(NSString *)apiKey)
{
  // TODO: remove the UIApplicationWillEnterForegroundNotification and
  // UIApplicationDidEnterBackgroundNotification observers and call enterForeground
  // and enterBackground manually.
  [[Amplitude instanceWithName:_escapedExperienceId] initializeApiKey:apiKey];
}

ABI30_0_0RCT_EXPORT_METHOD(setUserId:(NSString *)userId)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setUserId:userId];
}

ABI30_0_0RCT_EXPORT_METHOD(setUserProperties:(NSDictionary *)properties)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setUserProperties:properties];
}

ABI30_0_0RCT_EXPORT_METHOD(clearUserProperties)
{
  [[Amplitude instanceWithName:_escapedExperienceId] clearUserProperties];
}

ABI30_0_0RCT_EXPORT_METHOD(logEvent:(NSString *)eventName)
{
  [[Amplitude instanceWithName:_escapedExperienceId] logEvent:eventName];
}

ABI30_0_0RCT_EXPORT_METHOD(logEventWithProperties:(NSString *)eventName withProperties:(NSDictionary *)properties)
{
  [[Amplitude instanceWithName:_escapedExperienceId] logEvent:eventName withEventProperties:properties];
}

ABI30_0_0RCT_EXPORT_METHOD(setGroup:(NSString *)groupType withGroupNames:(NSArray *)groupNames)
{
  [[Amplitude instanceWithName:_escapedExperienceId] setGroup:groupType groupName:groupNames];
}

@end
