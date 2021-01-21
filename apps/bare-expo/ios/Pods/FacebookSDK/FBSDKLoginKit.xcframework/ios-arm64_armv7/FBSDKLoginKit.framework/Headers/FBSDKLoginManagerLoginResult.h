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

NS_ASSUME_NONNULL_BEGIN

#if TARGET_OS_TV

// This is an unfortunate hack for Swift Package Manager support.
// SPM does not allow us to conditionally exclude Swift files for compilation by platform.
//
// So to support tvOS with SPM we need to use runtime availability checks in the Swift files.
// This means that even though the code in `LoginManager.swift` will never be run for tvOS
// targets, it still needs to be able to compile. Hence we need to declare it here.
//
// The way to fix this is to remove extensions of ObjC types in Swift.

@interface LoginManagerLoginResult : NSObject

@property (copy, nonatomic, nullable) FBSDKAccessToken *token;
@property (copy, nonatomic, nullable) FBSDKAuthenticationToken *authenticationToken;
@property (readonly, nonatomic) BOOL isCancelled;
@property (copy, nonatomic) NSSet<NSString *> *grantedPermissions;
@property (copy, nonatomic) NSSet<NSString *> *declinedPermissions;

@end

#else

@class FBSDKAccessToken;
@class FBSDKAuthenticationToken;

/**
  Describes the result of a login attempt.
 */
NS_SWIFT_NAME(LoginManagerLoginResult)
@interface FBSDKLoginManagerLoginResult : NSObject

- (instancetype)init NS_UNAVAILABLE;
+ (instancetype)new NS_UNAVAILABLE;

/**
  the access token.
 */
@property (copy, nonatomic, nullable) FBSDKAccessToken *token;

/**
  the authentication token.
 */
@property (copy, nonatomic, nullable) FBSDKAuthenticationToken *authenticationToken;

/**
  whether the login was cancelled by the user.
 */
@property (readonly, nonatomic) BOOL isCancelled;

/**
  the set of permissions granted by the user in the associated request.

 inspect the token's permissions set for a complete list.
 */
@property (copy, nonatomic) NSSet<NSString *> *grantedPermissions;

/**
  the set of permissions declined by the user in the associated request.

 inspect the token's permissions set for a complete list.
 */
@property (copy, nonatomic) NSSet<NSString *> *declinedPermissions;

/**
  Initializes a new instance.
 @param token the access token
 @param authenticationToken the authentication token
 @param isCancelled whether the login was cancelled by the user
 @param grantedPermissions the set of granted permissions
 @param declinedPermissions the set of declined permissions
 */
- (instancetype)initWithToken:(nullable FBSDKAccessToken *)token
          authenticationToken:(nullable FBSDKAuthenticationToken *)authenticationToken
                  isCancelled:(BOOL)isCancelled
           grantedPermissions:(NSSet<NSString *> *)grantedPermissions
          declinedPermissions:(NSSet<NSString *> *)declinedPermissions
NS_DESIGNATED_INITIALIZER;
@end

#endif

NS_ASSUME_NONNULL_END
