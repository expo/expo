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

#import "FBSDKRestrictiveData.h"

#import <Foundation/Foundation.h>

#import "FBSDKInternalUtility.h"

#define RESTRICTIVE_PARAM @"restrictive_param"
#define DEPRECATED_PARAM @"deprecated_param"
#define IS_DEPRECATED_EVENT @"is_deprecated_event"

@implementation FBSDKRestrictiveData

- (instancetype)initWithEventName:(NSString *)eventName params:(id)params
{
  self = [super init];
  if (self) {
    NSDictionary<NSString *, id> *paramDict = [FBSDKTypeUtility dictionaryValue:params];
    if (!paramDict) {
      return nil;
    }
    _eventName = eventName;
    _restrictiveParams = paramDict[RESTRICTIVE_PARAM] ? [FBSDKTypeUtility dictionaryValue:paramDict[RESTRICTIVE_PARAM]] : nil;
    _deprecatedParams = paramDict[DEPRECATED_PARAM] ? [FBSDKTypeUtility arrayValue:paramDict[DEPRECATED_PARAM]] : nil;
    _deprecatedEvent = (paramDict[IS_DEPRECATED_EVENT] && [paramDict[IS_DEPRECATED_EVENT] respondsToSelector:@selector(boolValue)]) ? [paramDict[IS_DEPRECATED_EVENT] boolValue] : NO;
  }
  return self;
}

@end
