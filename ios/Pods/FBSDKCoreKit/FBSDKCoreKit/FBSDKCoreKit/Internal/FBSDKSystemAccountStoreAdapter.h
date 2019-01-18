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

#import <Accounts/Accounts.h>
#import <Foundation/Foundation.h>

typedef void (^FBSDKGraphRequestAccessToAccountsHandler)(NSString *oauthToken, NSError *accountStoreError);

/*
 @class

  Adapter around system account store APIs. Note this is only intended for internal
 consumption. If publicized, consider moving declarations to an internal only header and
 reconsider dispatching semantics.
 */
@interface FBSDKSystemAccountStoreAdapter : NSObject

/*
 s gets the oauth token stored in the account store credential, if available. If not empty,
 this implies user has granted access.
 */
@property (nonatomic, readonly, copy) NSString *accessTokenString;

/*
  Gets or sets the flag indicating if the next requestAccess call should block
 on a renew call.
 */
@property (nonatomic, assign) BOOL forceBlockingRenew;

/*
  A convenience getter to the Facebook account type in the account store, if available.
 */
@property (strong, nonatomic, readonly) ACAccountType *accountType;

/*
  The singleton instance.
 */
@property (class, nonatomic, strong) FBSDKSystemAccountStoreAdapter *sharedInstance;

/*
  Requests access to the device's Facebook account for the given parameters.
 @param permissions the permissions
 @param defaultAudience the default audience
 @param isReauthorize a flag describing if this is a reauth request
 @param appID the app id
 @param handler the handler that will be invoked on completion (dispatched to the main thread). the oauthToken is nil on failure.
 */
- (void)requestAccessToFacebookAccountStore:(NSSet *)permissions
                            defaultAudience:(NSString *)defaultAudience
                              isReauthorize:(BOOL)isReauthorize
                                      appID:(NSString *)appID
                                    handler:(FBSDKGraphRequestAccessToAccountsHandler)handler;

/*
  Sends a message to the device account store to renew the Facebook account credentials

 @param handler the handler that is invoked on completion
 */
- (void)renewSystemAuthorization:(void(^)(ACAccountCredentialRenewResult result, NSError *error))handler;

@end
