// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXSegment/EXSegment.h>

#import <SEGAnalytics.h>

@interface EXSegment ()

@property (nonatomic, strong) SEGAnalytics *instance;

@end

@implementation EXSegment

EX_EXPORT_MODULE(ExponentSegment)


EX_EXPORT_METHOD_AS(initializeIOS,
                    initializeIOS:(NSString *)writeKey
                    resolver:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  SEGAnalyticsConfiguration *configuration = [SEGAnalyticsConfiguration configurationWithWriteKey:writeKey];
  _instance = [[SEGAnalytics alloc] initWithConfiguration:configuration];
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

@end
