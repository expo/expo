// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI34_0_0EXSegment/ABI34_0_0EXSegment.h>
#import <ABI34_0_0UMConstantsInterface/ABI34_0_0UMConstantsInterface.h>
#import <Analytics/SEGAnalytics.h>

static NSString *const ABI34_0_0EXSegmentOptOutKey = @"ABI34_0_0EXSegmentOptOutKey";

@interface ABI34_0_0EXSegment ()

@property (nonatomic, strong) SEGAnalytics *instance;

@end

@implementation ABI34_0_0EXSegment

ABI34_0_0UM_EXPORT_MODULE(ExponentSegment)

ABI34_0_0UM_EXPORT_METHOD_AS(initializeIOS,
                    initializeIOS:(NSString *)writeKey
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  SEGAnalyticsConfiguration *configuration = [SEGAnalyticsConfiguration configurationWithWriteKey:writeKey];
  _instance = [[SEGAnalytics alloc] initWithConfiguration:configuration];
  NSNumber *optOutSetting = [[NSUserDefaults standardUserDefaults] objectForKey:ABI34_0_0EXSegmentOptOutKey];
  if (optOutSetting != nil && ![optOutSetting boolValue]) {
    [_instance disable];
  }
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(initializeAndroid,
                    initializeAndroid:(NSString *)writeKey
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  // NO-OP. Need this here because Segment has different keys for iOS and Android.
  reject(@"E_WRONG_PLATFORM", @"Method initializeAndroid should not be called on iOS, please file an issue on GitHub.", nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(identify,
                    identify:(NSString *)userId
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance identify:userId];
  }
  resolve(nil);
}


 ABI34_0_0UM_EXPORT_METHOD_AS(identifyWithTraits,
                     identifyWithTraits:(NSString *)userId
                     withTraits:(NSDictionary *)traits
                     resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                     rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance identify:userId traits:traits];
  }
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(track,
                    track:(NSString *)event
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance track:event];
  }
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(trackWithProperties,
                    trackWithProperties:(NSString *)event withProperties:(NSDictionary *)properties
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance track:event properties:properties];
  }
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(group,
                    group:(NSString *)groupId
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance group:groupId];
  }
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(groupWithTraits,
                    groupWithTraits:(NSString *)groupId
                    withTraits:(NSDictionary *)traits
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance group:groupId traits:traits];
  }
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(alias,
                    alias:(NSString *)newId
                    withOptions:(NSDictionary *)options
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  SEGAnalytics *analytics = _instance;
  if (analytics) {
    if (options) {
      [analytics alias:newId options:@{@"integrations": options}];
    } else {
      [analytics alias:newId];
    }
    resolve(ABI34_0_0UMNullIfNil(nil));
  } else {
    reject(@"E_NO_SEG", @"Segment instance has not been initialized yet, have you tried calling Segment.initialize prior to calling Segment.alias?", nil);
  }
}

ABI34_0_0UM_EXPORT_METHOD_AS(screen,
                    screen:(NSString *)screenName
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance screen:screenName];
  }
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(screenWithProperties,
                    screenWithProperties:(NSString *)screenName
                    withProperties:(NSDictionary *)properties
                    resolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance screen:screenName properties:properties];
  }
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(reset,
                    resetWithResolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance reset];
  }
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(flush,
                    flushWithResolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance flush];
  }
  resolve(nil);
}

ABI34_0_0UM_EXPORT_METHOD_AS(getEnabledAsync,
                    getEnabledWithResolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  NSNumber *optOutSetting = [[NSUserDefaults standardUserDefaults] objectForKey:ABI34_0_0EXSegmentOptOutKey];
  resolve(optOutSetting ?: @(YES));
}

ABI34_0_0UM_EXPORT_METHOD_AS(setEnabledAsync,
                    setEnabled:(BOOL)enabled
                    withResolver:(ABI34_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI34_0_0UMPromiseRejectBlock)reject)
{
  [[NSUserDefaults standardUserDefaults] setBool:enabled forKey:ABI34_0_0EXSegmentOptOutKey];
  if (_instance) {
    if (enabled) {
      [_instance enable];
    } else {
      [_instance disable];
    }
  }
  resolve(nil);
}

@end
