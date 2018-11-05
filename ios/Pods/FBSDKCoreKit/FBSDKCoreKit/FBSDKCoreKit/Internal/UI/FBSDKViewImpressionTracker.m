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

#import "FBSDKViewImpressionTracker.h"

#import "FBSDKAccessToken.h"
#import "FBSDKAppEvents+Internal.h"

@implementation FBSDKViewImpressionTracker
{
  NSMutableSet *_trackedImpressions;
}

#pragma mark - Class Methods

+ (instancetype)impressionTrackerWithEventName:(NSString *)eventName
{
  static NSMutableDictionary *_impressionTrackers = nil;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    _impressionTrackers = [[NSMutableDictionary alloc] init];
  });
  // Maintains a single instance of an impression tracker for each event name
  FBSDKViewImpressionTracker *impressionTracker = _impressionTrackers[eventName];
  if (!impressionTracker) {
    impressionTracker = [[self alloc] initWithEventName:eventName];
    _impressionTrackers[eventName] = impressionTracker;
  }
  return impressionTracker;
}

#pragma mark - Object Lifecycle

- (instancetype)initWithEventName:(NSString *)eventName
{
  if ((self = [super init])) {
    _eventName = [eventName copy];
    _trackedImpressions = [[NSMutableSet alloc] init];

    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_applicationDidEnterBackgroundNotification:)
                                                 name:UIApplicationDidEnterBackgroundNotification
                                               object:[UIApplication sharedApplication]];
  }
  return self;
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

#pragma mark - Public API

- (void)logImpressionWithIdentifier:(NSString *)identifier parameters:(NSDictionary *)parameters
{
  NSMutableDictionary *keys = [NSMutableDictionary dictionary];
  keys[@"__view_impression_identifier__"] = identifier;
  [keys addEntriesFromDictionary:parameters];
  NSDictionary *impressionKey = [keys copy];
  // Ensure that each impression is only tracked once
  if ([_trackedImpressions containsObject:impressionKey]) {
    return;
  }
  [_trackedImpressions addObject:impressionKey];

  [FBSDKAppEvents logImplicitEvent:self.eventName
                        valueToSum:nil
                        parameters:parameters
                       accessToken:[FBSDKAccessToken currentAccessToken]];
}

#pragma mark - Helper Methods

- (void)_applicationDidEnterBackgroundNotification:(NSNotification *)notification
{
  // reset all tracked impressions when the app backgrounds so we will start tracking them again the next time they
  // are triggered.
  [_trackedImpressions removeAllObjects];
}

@end
