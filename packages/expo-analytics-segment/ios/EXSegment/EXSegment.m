// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXSegment/EXSegment.h>
#import <EXConstantsInterface/EXConstantsInterface.h>
#import <SEGAnalytics.h>

static NSString *const EXSegmentOptOutKey = @"EXSegmentOptOutKey";

@interface EXSegment ()

@property (nonatomic, strong) SEGAnalytics *instance;
@property (nonatomic, weak) id<EXConstantsInterface> constants;

@end

@implementation EXSegment

EX_EXPORT_MODULE(ExponentSegment)

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _constants = [moduleRegistry getModuleImplementingProtocol:@protocol(EXConstantsInterface)];
}

EX_EXPORT_METHOD_AS(initializeIOS,
                    initializeIOS:(NSString *)writeKey
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  SEGAnalyticsConfiguration *configuration = [SEGAnalyticsConfiguration configurationWithWriteKey:writeKey];
  _instance = [[SEGAnalytics alloc] initWithConfiguration:configuration];
  NSNumber *optOutSetting = [[NSUserDefaults standardUserDefaults] objectForKey:EXSegmentOptOutKey];
  if (optOutSetting != nil && ![optOutSetting boolValue]) {
    [_instance disable];
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(initializeAndroid,
                    initializeAndroid:(NSString *)writeKey
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  // NO-OP. Need this here because Segment has different keys for iOS and Android.
  reject(@"E_WRONG_PLATFORM", @"Method initializeAndroid should not be called on iOS, please file an issue on GitHub.", nil);
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
                     resolver:(EXPromiseResolveBlock)resolve
                     rejecter:(EXPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance identify:userId traits:traits];
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
                    trackWithProperties:(NSString *)event withProperties:(NSDictionary *)properties
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance track:event properties:properties];
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
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance group:groupId traits:traits];
  }
  resolve(nil);
}

EX_EXPORT_METHOD_AS(alias,
                    alias:(NSString *)newId
                    withOptions:(NSDictionary *)options
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  SEGAnalytics *analytics = _instance;
  if (analytics) {
    if (options) {
      [analytics alias:newId options:@{@"integrations": options}];
    } else {
      [analytics alias:newId];
    }
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
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if (_instance) {
    [_instance screen:screenName properties:properties];
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
  NSNumber *optOutSetting = [[NSUserDefaults standardUserDefaults] objectForKey:EXSegmentOptOutKey];
  resolve(optOutSetting ?: @(YES));
}

EX_EXPORT_METHOD_AS(setEnabledAsync,
                    setEnabled:(BOOL)enabled
                    withResolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  if ([_constants.appOwnership isEqualToString:@"expo"]) {
    reject(@"E_UNSUPPORTED", @"Setting Segment's `enabled` is not supported in Expo Client.", nil);
    return;
  }
  [[NSUserDefaults standardUserDefaults] setBool:enabled forKey:EXSegmentOptOutKey];
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
