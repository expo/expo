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

// this type is not thread safe.
@interface FBSDKAppEventsState : NSObject<NSCopying, NSSecureCoding>

@property (readonly, copy) NSArray *events;
@property (readonly, assign) NSUInteger numSkipped;
@property (readonly, copy) NSString *tokenString;
@property (readonly, copy) NSString *appID;

- (instancetype)initWithToken:(NSString *)tokenString appID:(NSString *)appID NS_DESIGNATED_INITIALIZER;

- (void)addEvent:(NSDictionary *)eventDictionary isImplicit:(BOOL)isImplicit;
- (void)addEventsFromAppEventState:(FBSDKAppEventsState *)appEventsState;
- (BOOL)areAllEventsImplicit;
- (BOOL)isCompatibleWithAppEventsState:(FBSDKAppEventsState *)appEventsState;
- (BOOL)isCompatibleWithTokenString:(NSString *)tokenString appID:(NSString *)appID;
- (NSString *)JSONStringForEvents:(BOOL)includeImplicitEvents;
- (NSString *)extractReceiptData;

@end
