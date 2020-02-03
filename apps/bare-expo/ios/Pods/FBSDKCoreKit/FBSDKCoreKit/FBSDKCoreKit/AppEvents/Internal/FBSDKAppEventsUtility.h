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

#import <Foundation/Foundation.h>

@class FBSDKAccessToken;

typedef NS_ENUM(NSUInteger, FBSDKAdvertisingTrackingStatus)
{
  FBSDKAdvertisingTrackingAllowed,
  FBSDKAdvertisingTrackingDisallowed,
  FBSDKAdvertisingTrackingUnspecified
} NS_SWIFT_NAME(AppEventsUtility.AdvertisingTrackingStatus);

typedef NS_ENUM(NSUInteger, FBSDKAppEventsFlushReason)
{
  FBSDKAppEventsFlushReasonExplicit,
  FBSDKAppEventsFlushReasonTimer,
  FBSDKAppEventsFlushReasonSessionChange,
  FBSDKAppEventsFlushReasonPersistedEvents,
  FBSDKAppEventsFlushReasonEventThreshold,
  FBSDKAppEventsFlushReasonEagerlyFlushingEvent
} NS_SWIFT_NAME(AppEventsUtility.FlushReason);

NS_SWIFT_NAME(AppEventsUtility)
@interface FBSDKAppEventsUtility : NSObject

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

@property (class, nonatomic, copy, readonly) NSString *advertiserID;
@property (class, nonatomic, assign, readonly) FBSDKAdvertisingTrackingStatus advertisingTrackingStatus;
@property (class, nonatomic, strong, readonly) NSString *attributionID;
@property (class, nonatomic, assign, readonly) long unixTimeNow;
@property (class, nonatomic, assign, readonly) BOOL isDebugBuild;

+ (NSMutableDictionary *)activityParametersDictionaryForEvent:(NSString *)eventCategory
                                           implicitEventsOnly:(BOOL)implicitEventsOnly
                                    shouldAccessAdvertisingID:(BOOL)shouldAccessAdvertisingID;

+ (void)ensureOnMainThread:(NSString *)methodName className:(NSString *)className;
+ (NSString *)flushReasonToString:(FBSDKAppEventsFlushReason)flushReason;
+ (void)logAndNotify:(NSString *)msg allowLogAsDeveloperError:(BOOL)allowLogAsDeveloperError;
+ (void)logAndNotify:(NSString *)msg;
+ (NSString *)tokenStringToUseFor:(FBSDKAccessToken *)token;
+ (BOOL)validateIdentifier:(NSString *)identifier;
+ (id)getVariable:(NSString *)variableName fromInstance:(NSObject *)instance;
+ (NSNumber *)getNumberValue:(NSString *)text;
+ (BOOL)isSensitiveUserData:(NSString *)text;

@end
