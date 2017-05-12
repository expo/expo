// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI17_0_0EXSegment.h"

#import <SEGAnalytics.h>

@interface ABI17_0_0EXSegment ()

@property (nonatomic, strong) SEGAnalytics *instance;

@end

@implementation ABI17_0_0EXSegment

ABI17_0_0RCT_EXPORT_MODULE(ExponentSegment);

ABI17_0_0RCT_EXPORT_METHOD(initializeIOS:(NSString *)writeKey)
{
  SEGAnalyticsConfiguration *configuration = [SEGAnalyticsConfiguration configurationWithWriteKey:writeKey];
  _instance = [[SEGAnalytics alloc] initWithConfiguration:configuration];
}

ABI17_0_0RCT_EXPORT_METHOD(initializeAndroid:(NSString *)writeKey)
{
  // NO-OP. Need this here because Segment has different keys for iOS and Android.
}

ABI17_0_0RCT_EXPORT_METHOD(identify:(NSString *)userId)
{
  if (_instance) {
    [_instance identify:userId];
  }
}


ABI17_0_0RCT_EXPORT_METHOD(identifyWithTraits:(NSString *)userId withTraits:(NSDictionary *)traits)
{
  if (_instance) {
    [_instance identify:userId traits:traits];
  }
}

ABI17_0_0RCT_EXPORT_METHOD(track:(NSString *)event)
{
  if (_instance) {
    [_instance track:event];
  }
}

ABI17_0_0RCT_EXPORT_METHOD(trackWithProperties:(NSString *)event withProperties:(NSDictionary *)properties)
{
  if (_instance) {
    [_instance track:event properties:properties];
  }
}

ABI17_0_0RCT_EXPORT_METHOD(flush)
{
  if (_instance) {
    [_instance flush];
  }
}

@end
