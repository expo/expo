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

 #import "FBSDKSKAdNetworkEvent.h"

 #import <Foundation/Foundation.h>

 #import "FBSDKCoreKit+Internal.h"

@implementation FBSDKSKAdNetworkEvent

- (nullable instancetype)initWithJSON:(NSDictionary<NSString *, id> *)dict
{
  if ((self = [super init])) {
    dict = [FBSDKTypeUtility dictionaryValue:dict];
    if (!dict) {
      return nil;
    }
    _eventName = [FBSDKTypeUtility dictionary:dict objectForKey:@"event_name" ofType:NSString.class];
    // Event name is a required field
    if (!_eventName) {
      return nil;
    }
    // Values is an optional field
    NSArray<NSDictionary<NSString *, id> *> *valueEntries = [FBSDKTypeUtility dictionary:dict objectForKey:@"values" ofType:NSArray.class];
    if (valueEntries) {
      NSMutableDictionary<NSString *, NSNumber *> *valueDict = [NSMutableDictionary new];
      for (NSDictionary<NSString *, id> *valueEntry in valueEntries) {
        NSDictionary<NSString *, id> *value = [FBSDKTypeUtility dictionaryValue:valueEntry];
        NSString *currency = [FBSDKTypeUtility dictionary:value objectForKey:@"currency" ofType:NSString.class];
        NSNumber *amount = [FBSDKTypeUtility dictionary:value objectForKey:@"amount" ofType:NSNumber.class];
        if (!currency || amount == nil) {
          return nil;
        }
        [FBSDKTypeUtility dictionary:valueDict setObject:amount forKey:[currency uppercaseString]];
      }
      _values = [valueDict copy];
    }
  }
  return self;
}

@end

#endif
