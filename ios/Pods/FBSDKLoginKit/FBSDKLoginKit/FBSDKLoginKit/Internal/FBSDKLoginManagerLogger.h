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

#import "FBSDKLoginManager+Internal.h"

extern NSString *const FBSDKLoginManagerLoggerAuthMethod_Native;
extern NSString *const FBSDKLoginManagerLoggerAuthMethod_Browser;
extern NSString *const FBSDKLoginManagerLoggerAuthMethod_System;
extern NSString *const FBSDKLoginManagerLoggerAuthMethod_Webview;
extern NSString *const FBSDKLoginManagerLoggerAuthMethod_SFVC;


@interface FBSDKLoginManagerLogger : NSObject
+ (FBSDKLoginManagerLogger *)loggerFromParameters:(NSDictionary *)parameters;

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)new NS_UNAVAILABLE;

- (instancetype)initWithLoggingToken:(NSString *)loggingToken;

// this must not retain loginManager - only used to conveniently grab various properties to log.
- (void)startSessionForLoginManager:(FBSDKLoginManager *)loginManager;
- (void)endSession;

- (void)startAuthMethod:(NSString *)authMethod;
- (void)endLoginWithResult:(FBSDKLoginManagerLoginResult *)result error:(NSError *)error;

- (NSDictionary *)parametersWithTimeStampAndClientState:(NSDictionary *)loginParams forAuthMethod:(NSString *)authMethod;
- (void)willAttemptAppSwitchingBehavior;
- (void)systemAuthDidShowDialog:(BOOL)didShowDialog isUnTOSedDevice:(BOOL)isUnTOSedDevice;

- (void)logNativeAppDialogResult:(BOOL)result dialogDuration:(NSTimeInterval)dialogDuration;
@end
