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

/**
  Describes the result of a login attempt.
 */
@interface FBSDKLoginManagerLoginResult : NSObject

/**
  the access token.
 */
@property (copy, nonatomic) FBSDKAccessToken *token;

/**
  whether the login was cancelled by the user.
 */
@property (readonly, nonatomic) BOOL isCancelled;

/**
  the set of permissions granted by the user in the associated request.

 inspect the token's permissions set for a complete list.
 */
@property (copy, nonatomic) NSSet *grantedPermissions;

/**
  the set of permissions declined by the user in the associated request.

 inspect the token's permissions set for a complete list.
 */
@property (copy, nonatomic) NSSet *declinedPermissions;

/**
  Initializes a new instance.
 - Parameter token: the access token
 - Parameter isCancelled: whether the login was cancelled by the user
 - Parameter grantedPermissions: the set of granted permissions
 - Parameter declinedPermissions: the set of declined permissions
 */
- (instancetype)initWithToken:(FBSDKAccessToken *)token
                  isCancelled:(BOOL)isCancelled
           grantedPermissions:(NSSet *)grantedPermissions
          declinedPermissions:(NSSet *)declinedPermissions
NS_DESIGNATED_INITIALIZER;
@end
