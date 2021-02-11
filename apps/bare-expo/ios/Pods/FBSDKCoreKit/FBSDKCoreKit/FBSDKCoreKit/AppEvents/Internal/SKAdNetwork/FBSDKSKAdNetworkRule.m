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

 #import "FBSDKSKAdNetworkRule.h"

 #import "FBSDKCoreKit+Internal.h"

@implementation FBSDKSKAdNetworkRule

- (nullable instancetype)initWithJSON:(NSDictionary<NSString *, id> *)dict
{
  if ((self = [super init])) {
    dict = [FBSDKTypeUtility dictionaryValue:dict];
    if (!dict) {
      return nil;
    }
    NSNumber *value = [FBSDKTypeUtility dictionary:dict objectForKey:@"conversion_value" ofType:NSNumber.class];
    NSArray<FBSDKSKAdNetworkEvent *> *events = [FBSDKSKAdNetworkRule parseEvents:[FBSDKTypeUtility dictionary:dict objectForKey:@"events" ofType:NSArray.class]];
    if (value == nil || !events) {
      return nil;
    }
    _conversionValue = value.integerValue;
    _events = events;
  }
  return self;
}

- (BOOL)isMatchedWithRecordedEvents:(NSSet<NSString *> *)recordedEvents
                     recordedValues:(NSDictionary<NSString *, NSDictionary *> *)recordedValues
{
  for (FBSDKSKAdNetworkEvent *event in self.events) {
    // Check if event name matches
    if (![recordedEvents containsObject:event.eventName]) {
      return NO;
    }
    // Check if event value matches when values is not nil
    if (event.values) {
      NSDictionary<NSString *, NSNumber *> *recordedEventValues = [FBSDKTypeUtility dictionary:recordedValues objectForKey:event.eventName ofType:NSDictionary.class];
      if (!recordedEventValues) {
        return NO;
      }
      for (NSString *currency in event.values) {
        NSNumber *valueInMapping = [FBSDKTypeUtility dictionary:event.values objectForKey:currency ofType:NSNumber.class];
        NSNumber *value = [FBSDKTypeUtility dictionary:recordedEventValues objectForKey:currency ofType:NSNumber.class];
        if (value != nil && valueInMapping != nil && value.doubleValue > valueInMapping.doubleValue) {
          return YES;
        }
      }
      return NO;
    }
  }
  return YES;
}

+ (NSArray<FBSDKSKAdNetworkEvent *> *)parseEvents:(nullable NSArray<NSDictionary<NSString *, id> *> *)events
{
  if (!events) {
    return nil;
  }
  NSMutableArray<FBSDKSKAdNetworkEvent *> *parsedEvents = [NSMutableArray new];
  for (NSDictionary<NSString *, id> *eventEntry in events) {
    FBSDKSKAdNetworkEvent *event = [[FBSDKSKAdNetworkEvent alloc] initWithJSON:eventEntry];
    if (!event) {
      return nil;
    }
    [FBSDKTypeUtility array:parsedEvents addObject:event];
  }
  return [parsedEvents copy];
}

@end

#endif
