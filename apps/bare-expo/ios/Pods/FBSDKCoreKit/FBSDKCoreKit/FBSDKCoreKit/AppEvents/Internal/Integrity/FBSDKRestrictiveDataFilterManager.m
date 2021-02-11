// Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
//
// You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
// copy, modify, and distribute this software in source code or binary form for use
// in connection with the web services and APIs provided by Facebook.
//
// As with any software that integrates with the Facebook platform, your use of
// this software is subject to the Facebook Developer Principles and Policies
// [http://developers.facebook.com/policy/]. This copyright notice shall be
// included in all copies or substantial portions of the software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
// FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
// COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
// IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

#import "FBSDKRestrictiveDataFilterManager.h"

#import "FBSDKInternalUtility.h"
#import "FBSDKServerConfigurationManager.h"

@interface FBSDKRestrictiveEventFilter : NSObject

@property (nonatomic, readonly, copy) NSString *eventName;
@property (nonatomic, readonly, copy) NSDictionary<NSString *, id> *restrictiveParams;

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

- (instancetype)initWithEventName:(NSString *)eventName
                restrictiveParams:(NSDictionary<NSString *, id> *)restrictiveParams;

@end

@implementation FBSDKRestrictiveEventFilter

- (instancetype)initWithEventName:(NSString *)eventName
                restrictiveParams:(NSDictionary<NSString *, id> *)restrictiveParams
{
  self = [super init];
  if (self) {
    _eventName = [eventName copy];
    _restrictiveParams = [restrictiveParams copy];
  }

  return self;
}

@end

@implementation FBSDKRestrictiveDataFilterManager

static BOOL g_isRestrictiveEventFilterEnabled;
static NSMutableArray<FBSDKRestrictiveEventFilter *> *_params;
static NSMutableSet<NSString *> *_restrictedEvents;

+ (void)enable
{
  @try {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      NSDictionary<NSString *, id> *restrictiveParams = [FBSDKServerConfigurationManager cachedServerConfiguration].restrictiveParams;
      if (restrictiveParams) {
        [FBSDKRestrictiveDataFilterManager _updateFilters:restrictiveParams];
        g_isRestrictiveEventFilterEnabled = YES;
      }
    });
  } @catch (NSException *exception) {}
}

+ (NSDictionary<NSString *, id> *)processParameters:(NSDictionary<NSString *, id> *)parameters
                                          eventName:(NSString *)eventName
{
  if (!g_isRestrictiveEventFilterEnabled) {
    return parameters;
  }
  if (parameters) {
    @try {
      NSMutableDictionary<NSString *, id> *params = [NSMutableDictionary dictionaryWithDictionary:parameters];
      NSMutableDictionary<NSString *, NSString *> *restrictedParams = [NSMutableDictionary dictionary];

      for (NSString *key in [parameters keyEnumerator]) {
        NSString *type = [FBSDKRestrictiveDataFilterManager _getMatchedDataTypeWithEventName:eventName
                                                                                    paramKey:key];
        if (type) {
          [FBSDKTypeUtility dictionary:restrictedParams setObject:type forKey:key];
          [params removeObjectForKey:key];
        }
      }

      if ([[restrictedParams allKeys] count] > 0) {
        NSString *restrictedParamsJSONString = [FBSDKBasicUtility JSONStringForObject:restrictedParams
                                                                                error:NULL
                                                                 invalidObjectHandler:NULL];
        [FBSDKTypeUtility dictionary:params setObject:restrictedParamsJSONString forKey:@"_restrictedParams"];
      }

      return [params copy];
    } @catch (NSException *exception) {
      return parameters;
    }
  }

  return nil;
}

+ (void)processEvents:(NSMutableArray<NSMutableDictionary<NSString *, id> *> *)events
{
  @try {
    if (!g_isRestrictiveEventFilterEnabled) {
      return;
    }

    static NSString *const REPLACEMENT_STRING = @"_removed_";

    for (NSDictionary<NSString *, NSMutableDictionary<NSString *, id> *> *event in events) {
      if ([FBSDKRestrictiveDataFilterManager _isRestrictedEvent:event[@"event"][@"_eventName"]]) {
        [FBSDKTypeUtility dictionary:event[@"event"] setObject:REPLACEMENT_STRING forKey:@"_eventName"];
      }
    }
  } @catch (NSException *exception) {}
}

#pragma mark - Private Methods

+ (BOOL)_isRestrictedEvent:(NSString *)eventName
{
  @synchronized(self) {
    return [_restrictedEvents containsObject:eventName];
  }
}

+ (nullable NSString *)_getMatchedDataTypeWithEventName:(NSString *)eventName
                                               paramKey:(NSString *)paramKey
{
  // match by params in custom events with event name
  for (FBSDKRestrictiveEventFilter *filter in _params) {
    if ([filter.eventName isEqualToString:eventName]) {
      NSString *type = [FBSDKTypeUtility stringValue:filter.restrictiveParams[paramKey]];
      if (type) {
        return type;
      }
    }
  }
  return nil;
}

+ (void)_updateFilters:(nullable NSDictionary<NSString *, id> *)restrictiveParams
{
  static NSString *const RESTRICTIVE_PARAM_KEY = @"restrictive_param";
  static NSString *const PROCESS_EVENT_NAME_KEY = @"process_event_name";

  restrictiveParams = [FBSDKTypeUtility dictionaryValue:restrictiveParams];
  if (restrictiveParams.count > 0) {
    @synchronized(self) {
      [_params removeAllObjects];
      [_restrictedEvents removeAllObjects];
      NSMutableArray<FBSDKRestrictiveEventFilter *> *eventFilterArray = [NSMutableArray array];
      NSMutableSet<NSString *> *restrictedEventSet = [NSMutableSet set];
      for (NSString *eventName in restrictiveParams.allKeys) {
        NSDictionary<NSString *, id> *eventInfo = restrictiveParams[eventName];
        if (!eventInfo) {
          continue;
        }
        if (eventInfo[RESTRICTIVE_PARAM_KEY]) {
          FBSDKRestrictiveEventFilter *restrictiveEventFilter = [[FBSDKRestrictiveEventFilter alloc] initWithEventName:eventName
                                                                                                     restrictiveParams:eventInfo[RESTRICTIVE_PARAM_KEY]];
          [FBSDKTypeUtility array:eventFilterArray addObject:restrictiveEventFilter];
        }
        if (restrictiveParams[eventName][PROCESS_EVENT_NAME_KEY]) {
          [restrictedEventSet addObject:eventName];
        }
      }
      _params = eventFilterArray;
      _restrictedEvents = restrictedEventSet;
    }
  }
}

@end
