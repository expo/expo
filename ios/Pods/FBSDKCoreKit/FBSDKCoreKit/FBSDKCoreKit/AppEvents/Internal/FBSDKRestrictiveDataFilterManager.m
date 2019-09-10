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

#import "FBSDKBasicUtility+Internal.h"
#import "FBSDKTypeUtility.h"

@interface FBSDKRestrictiveEventFilter : NSObject

@property (nonatomic, readonly, copy) NSString *eventName;
@property (nonatomic, readonly, copy) NSDictionary<NSString *, id> *eventParams;

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

-(instancetype)initWithEventName:(NSString *)eventName
                     eventParams:(NSDictionary<NSString *, id> *)eventParams;

@end

@implementation FBSDKRestrictiveEventFilter

-(instancetype)initWithEventName:(NSString *)eventName
                     eventParams:(NSDictionary<NSString *, id> *)eventParams
{
  self = [super init];
  if (self) {
    _eventName = eventName;
    _eventParams = eventParams;
  }

  return self;
}

@end

@implementation FBSDKRestrictiveDataFilterManager

static NSMutableArray<FBSDKRestrictiveEventFilter *>  *_params;
static NSMutableSet<NSString *> *_deprecatedEvents;

+ (void)updateFilters:(nullable NSDictionary<NSString *, id> *)restrictiveParams
{
  if (restrictiveParams.count > 0) {
    [_params removeAllObjects];
    [_deprecatedEvents removeAllObjects];
    NSMutableArray<FBSDKRestrictiveEventFilter *> *eventFilterArray = [NSMutableArray array];
    NSMutableSet<NSString *> *deprecatedEventSet = [NSMutableSet set];
    for (NSString *eventName in restrictiveParams.allKeys) {
      if (restrictiveParams[eventName][@"is_deprecated_event"]) {
        [deprecatedEventSet addObject:eventName];
      }
      if (restrictiveParams[eventName][@"restrictive_param"]) {
        FBSDKRestrictiveEventFilter *restrictiveEventFilter = [[FBSDKRestrictiveEventFilter alloc] initWithEventName:eventName
                                                                                                         eventParams:restrictiveParams[eventName][@"restrictive_param"]];
        [eventFilterArray addObject:restrictiveEventFilter];
      }
    }
    _params = eventFilterArray;
    _deprecatedEvents = deprecatedEventSet;
  }
}

+ (nullable NSString *)getMatchedDataTypeWithEventName:(NSString *)eventName
                                              paramKey:(NSString *)paramKey
{
  // match by params in custom events with event name
  for (FBSDKRestrictiveEventFilter *filter in _params) {
    if ([filter.eventName isEqualToString:eventName]) {
      NSString *type = [FBSDKTypeUtility stringValue:filter.eventParams[paramKey]];
      if (type) {
        return type;
      }
    }
  }
  return nil;
}

+ (BOOL)isDeprecatedEvent:(NSString *)eventName
{
  return [_deprecatedEvents containsObject:eventName];
}

+ (void)processEvents:(NSMutableArray<NSDictionary<NSString *, id> *> *)events
{
  NSArray<NSDictionary<NSString *, id> *> *eventArray = [events copy];
  for (NSDictionary<NSString *, NSDictionary<NSString *, id> *> *event in eventArray) {
    if ([FBSDKRestrictiveDataFilterManager isDeprecatedEvent:event[@"event"][@"_eventName"]]) {
      [events removeObject:event];
    }
  }
}

+ (NSDictionary<NSString *,id> *)processParameters:(NSDictionary<NSString *,id> *)parameters
                                         eventName:(NSString *)eventName
{
  if (parameters) {
    NSMutableDictionary<NSString *, id> *params = [NSMutableDictionary dictionaryWithDictionary:parameters];
    NSMutableDictionary<NSString *, NSString *> *restrictedParams = [NSMutableDictionary dictionary];

    for (NSString *key in [parameters keyEnumerator]) {
      NSString *type = [FBSDKRestrictiveDataFilterManager getMatchedDataTypeWithEventName:eventName
                                                                                 paramKey:key];
      if (type) {
        [restrictedParams setObject:type forKey:key];
        [params removeObjectForKey:key];
      }
    }

    if ([[restrictedParams allKeys] count] > 0) {
      NSString *restrictedParamsJSONString = [FBSDKBasicUtility JSONStringForObject:restrictedParams
                                                                              error:NULL
                                                               invalidObjectHandler:NULL];
      [FBSDKBasicUtility dictionary:params setObject:restrictedParamsJSONString forKey:@"_restrictedParams"];
    }

    return [params copy];
  }

  return nil;
}

#pragma mark Helper functions

+ (BOOL)isMatchedWithPattern:(NSString *)pattern
                        text:(NSString *)text
{
  NSRegularExpression *regex = [[NSRegularExpression alloc] initWithPattern:pattern options:NSRegularExpressionCaseInsensitive error:nil];
  NSUInteger matches = [regex numberOfMatchesInString:text options:0 range:NSMakeRange(0, text.length)];
  return matches > 0;
}

@end
