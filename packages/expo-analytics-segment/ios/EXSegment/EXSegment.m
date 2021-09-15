// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXSegment/EXSegment.h>
#import <Analytics/SEGAnalytics.h>

static NSString *const EXSegmentEnabledKey = @"EXSegmentEnabledKey";

@interface EXSegment ()

@property (nonatomic, strong) SEGAnalytics *instance;

@end

@implementation EXSegment

EX_EXPORT_MODULE(ExponentSegment)

EX_EXPORT_METHOD_AS(initialize,
                    initialize:(NSString *)writeKey
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  SEGAnalyticsConfiguration *configuration = [SEGAnalyticsConfiguration configurationWithWriteKey:writeKey];
  NSNumber *enabledSetting = [[NSUserDefaults standardUserDefaults] objectForKey:EXSegmentEnabledKey];
  _instance = [[SEGAnalytics alloc] initWithConfiguration:configuration];
  if (enabledSetting != nil && ![enabledSetting boolValue]) {
    [_instance disable];
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(identify,
                    identify:(NSString *)userId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance identify:userId];
  }
  resolve(nil);
}


 EX_EXPORT_METHOD_AS(identifyWithTraits,
                     identifyWithTraits:(NSString *)userId
                     withTraits:(NSDictionary *)traits
                     withOptions:(nullable NSDictionary *)options
                     resolver:(EXPromiseResolveBlock)resolve
                     rejecter:(EXPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance identify:userId traits:traits options:options];
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(track,
                    track:(NSString *)event
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance track:event];
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(trackWithProperties,
                    trackWithProperties:(NSString *)event 
                    withProperties:(NSDictionary *)properties
                    withOptions:(nullable NSDictionary *)options
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance track:event properties:properties options:options];
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(group,
                    group:(NSString *)groupId
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance group:groupId];
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(groupWithTraits,
                    groupWithTraits:(NSString *)groupId
                    withTraits:(NSDictionary *)traits
                    withOptions:(nullable NSDictionary *)options
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance group:groupId traits:traits options:options];
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(alias,
                    alias:(NSString *)newId
                    withOptions:(nullable NSDictionary *)options
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  SEGAnalytics *analytics = _instance;
  if (analytics) {
    [analytics alias:newId options:options];
    resolve(EXNullIfNil(nil));
  } else {
    reject(@"E_NO_SEG", @"Segment instance has not been initialized yet, have you tried calling Segment.initialize prior to calling Segment.alias?", nil);
  }
}

EX_EXPORT_METHOD_AS(screen,
                    screen:(NSString *)screenName
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance screen:screenName];
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(screenWithProperties,
                    screenWithProperties:(NSString *)screenName
                    withProperties:(NSDictionary *)properties
                    withOptions:(NSDictionary *)options
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance screen:screenName properties:properties options:options];
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(reset,
                    resetWithResolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance reset];
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(flush,
                    flushWithResolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance flush];
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(getEnabledAsync,
                    getEnabledWithResolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  NSNumber *optOutSetting = [[NSUserDefaults standardUserDefaults] objectForKey:EXSegmentEnabledKey];
  // default is enabled: true
  resolve(optOutSetting ?: @(YES));
}

EX_EXPORT_METHOD_AS(setEnabledAsync,
                    setEnabled:(BOOL)enabled
                    withResolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [[NSUserDefaults standardUserDefaults] setBool:enabled forKey:EXSegmentEnabledKey];
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
