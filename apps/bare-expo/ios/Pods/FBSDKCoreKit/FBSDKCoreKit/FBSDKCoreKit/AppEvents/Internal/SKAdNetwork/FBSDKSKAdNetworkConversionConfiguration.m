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

#import "TargetConditionals.h"

#if !TARGET_OS_TV

 #import "FBSDKSKAdNetworkConversionConfiguration.h"

 #import "FBSDKCoreKit+Internal.h"

@implementation FBSDKSKAdNetworkConversionConfiguration

- (nullable instancetype)initWithJSON:(nullable NSDictionary<NSString *, id> *)dict
{
  if ((self = [super init])) {
    @try {
      dict = [FBSDKTypeUtility dictionaryValue:dict];
      if (!dict) {
        return nil;
      }
      NSArray<id> *data = [FBSDKTypeUtility dictionary:dict objectForKey:@"data" ofType:NSArray.class];
      NSDictionary<NSString *, id> *conversionRules = [FBSDKTypeUtility dictionaryValue:[FBSDKTypeUtility array:data objectAtIndex:0]];
      if (!conversionRules) {
        return nil;
      }
      _timerBuckets = [FBSDKTypeUtility integerValue:conversionRules[@"timer_buckets"]];
      _timerInterval = (NSTimeInterval)[FBSDKTypeUtility integerValue:conversionRules[@"timer_interval"]];
      _cutoffTime = [FBSDKTypeUtility integerValue:conversionRules[@"cutoff_time"]];
      _defaultCurrency = [[FBSDKTypeUtility stringValue:conversionRules[@"default_currency"]] uppercaseString];
      _conversionValueRules = [FBSDKSKAdNetworkConversionConfiguration parseRules:conversionRules[@"conversion_value_rules"]];
      if (!_conversionValueRules || !_defaultCurrency) {
        return nil;
      }
      _eventSet = [FBSDKSKAdNetworkConversionConfiguration getEventSetFromRules:_conversionValueRules];
      _currencySet = [FBSDKSKAdNetworkConversionConfiguration getCurrencySetFromRules:_conversionValueRules];
    } @catch (NSException *exception) {
      return nil;
    }
  }
  return self;
}

+ (NSSet<NSString *> *)getEventSetFromRules:(NSArray<FBSDKSKAdNetworkRule *> *)rules
{
  NSMutableSet<NSString *> *eventSet = [NSMutableSet new];
  for (FBSDKSKAdNetworkRule *rule in rules) {
    if (!rule) {
      continue;
    }
    for (FBSDKSKAdNetworkEvent *event in rule.events) {
      if (event.eventName) {
        [eventSet addObject:event.eventName];
      }
    }
  }
  return [eventSet copy];
}

+ (NSSet<NSString *> *)getCurrencySetFromRules:(NSArray<FBSDKSKAdNetworkRule *> *)rules
{
  NSMutableSet<NSString *> *currencySet = [NSMutableSet new];
  for (FBSDKSKAdNetworkRule *rule in rules) {
    if (!rule) {
      continue;
    }
    for (FBSDKSKAdNetworkEvent *event in rule.events) {
      for (NSString *currency in event.values) {
        [currencySet addObject:[currency uppercaseString]];
      }
    }
  }
  return [currencySet copy];
}

+ (nullable NSArray<FBSDKSKAdNetworkRule *> *)parseRules:(nullable NSArray<id> *)rules
{
  rules = [FBSDKTypeUtility arrayValue:rules];
  if (!rules) {
    return nil;
  }
  NSMutableArray<FBSDKSKAdNetworkRule *> *parsedRules = [NSMutableArray new];
  for (id ruleEntry in rules) {
    FBSDKSKAdNetworkRule *rule = [[FBSDKSKAdNetworkRule alloc] initWithJSON:ruleEntry];
    [FBSDKTypeUtility array:parsedRules addObject:rule];
  }
  [parsedRules sortUsingComparator:^NSComparisonResult (FBSDKSKAdNetworkRule *obj1, FBSDKSKAdNetworkRule *obj2) {
    if (obj1.conversionValue < obj2.conversionValue) {
      return NSOrderedDescending;
    }
    if (obj1.conversionValue < obj2.conversionValue) {
      return NSOrderedAscending;
    }
    return NSOrderedSame;
  }];
  return [parsedRules copy];
}

@end

#endif
