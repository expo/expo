// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI36_0_0EXSegment/ABI36_0_0EXSegment.h>
#import <ABI36_0_0UMConstantsInterface/ABI36_0_0UMConstantsInterface.h>
#import <Analytics/SEGAnalytics.h>

static NSString *const ABI36_0_0EXSegmentEnabledKey = @"ABI36_0_0EXSegmentEnabledKey";

@interface ABI36_0_0EXSegment ()

@property (nonatomic, strong) SEGAnalytics *instance;

@end

@implementation ABI36_0_0EXSegment

ABI36_0_0UM_EXPORT_MODULE(ExponentSegment)

ABI36_0_0UM_EXPORT_METHOD_AS(initializeIOS,
                    initializeIOS:(NSString *)writeKey
                    resolver:(ABI36_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI36_0_0UMPromiseRejectBlock)reject)
{
  SEGAnalyticsConfiguration *configuration = [SEGAnalyticsConfiguration configurationWithWriteKey:writeKey];
  NSNumber *enabledSetting = [[NSUserDefaults standardUserDefaults] objectForKey:ABI36_0_0EXSegmentEnabledKey];
  _instance = [[SEGAnalytics alloc] initWithConfiguration:configuration];
  if (enabledSetting != nil && ![enabledSetting boolValue]) {
    [_instance disable];
  }
  resolve(nil);
}

ABI36_0_0UM_EXPORT_METHOD_AS(initializeAndroid,
                    initializeAndroid:(NSString *)writeKey
                    resolver:(ABI36_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI36_0_0UMPromiseRejectBlock)reject)
{
  // NO-OP. Need this here because Segment has different keys for iOS and Android.
  reject(@"E_WRONG_PLATFORM", @"Method initializeAndroid should not be called on iOS, please file an issue on GitHub.", nil);
}

ABI36_0_0UM_EXPORT_METHOD_AS(identify,
                    identify:(NSString *)userId
                    resolver:(ABI36_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI36_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance identify:userId];
  }
  resolve(nil);
}


 ABI36_0_0UM_EXPORT_METHOD_AS(identifyWithTraits,
                     identifyWithTraits:(NSString *)userId
                     withTraits:(NSDictionary *)traits
                     resolver:(ABI36_0_0UMPromiseResolveBlock)resolve
                     rejecter:(ABI36_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance identify:userId traits:traits];
  }
  resolve(nil);
}

ABI36_0_0UM_EXPORT_METHOD_AS(track,
                    track:(NSString *)event
                    resolver:(ABI36_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI36_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance track:event];
  }
  resolve(nil);
}

ABI36_0_0UM_EXPORT_METHOD_AS(trackWithProperties,
                    trackWithProperties:(NSString *)event withProperties:(NSDictionary *)properties
                    resolver:(ABI36_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI36_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance track:event properties:properties];
  }
  resolve(nil);
}

ABI36_0_0UM_EXPORT_METHOD_AS(group,
                    group:(NSString *)groupId
                    resolver:(ABI36_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI36_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance group:groupId];
  }
  resolve(nil);
}

ABI36_0_0UM_EXPORT_METHOD_AS(groupWithTraits,
                    groupWithTraits:(NSString *)groupId
                    withTraits:(NSDictionary *)traits
                    resolver:(ABI36_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI36_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance group:groupId traits:traits];
  }
  resolve(nil);
}

ABI36_0_0UM_EXPORT_METHOD_AS(alias,
                    alias:(NSString *)newId
                    withOptions:(NSDictionary *)options
                    resolver:(ABI36_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI36_0_0UMPromiseRejectBlock)reject)
{
  SEGAnalytics *analytics = _instance;
  if (analytics) {
    if (options) {
      [analytics alias:newId options:@{@"integrations": options}];
    } else {
      [analytics alias:newId];
    }
    resolve(ABI36_0_0UMNullIfNil(nil));
  } else {
    reject(@"E_NO_SEG", @"Segment instance has not been initialized yet, have you tried calling Segment.initialize prior to calling Segment.alias?", nil);
  }
}

ABI36_0_0UM_EXPORT_METHOD_AS(screen,
                    screen:(NSString *)screenName
                    resolver:(ABI36_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI36_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance screen:screenName];
  }
  resolve(nil);
}

ABI36_0_0UM_EXPORT_METHOD_AS(screenWithProperties,
                    screenWithProperties:(NSString *)screenName
                    withProperties:(NSDictionary *)properties
                    resolver:(ABI36_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI36_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance screen:screenName properties:properties];
  }
  resolve(nil);
}

ABI36_0_0UM_EXPORT_METHOD_AS(reset,
                    resetWithResolver:(ABI36_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI36_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance reset];
  }
  resolve(nil);
}

ABI36_0_0UM_EXPORT_METHOD_AS(flush,
                    flushWithResolver:(ABI36_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI36_0_0UMPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance flush];
  }
  resolve(nil);
}

ABI36_0_0UM_EXPORT_METHOD_AS(getEnabledAsync,
                    getEnabledWithResolver:(ABI36_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI36_0_0UMPromiseRejectBlock)reject)
{
  NSNumber *optOutSetting = [[NSUserDefaults standardUserDefaults] objectForKey:ABI36_0_0EXSegmentEnabledKey];
  // default is enabled: true
  resolve(optOutSetting ?: @(YES));
}

ABI36_0_0UM_EXPORT_METHOD_AS(setEnabledAsync,
                    setEnabled:(BOOL)enabled
                    withResolver:(ABI36_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI36_0_0UMPromiseRejectBlock)reject)
{
  [[NSUserDefaults standardUserDefaults] setBool:enabled forKey:ABI36_0_0EXSegmentEnabledKey];
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
