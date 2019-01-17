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

#import "FBSDKSystemAccountStoreAdapter.h"

#import "FBSDKAccessToken.h"
#import "FBSDKConstants.h"
#import "FBSDKDynamicFrameworkLoader.h"
#import "FBSDKError.h"
#import "FBSDKLogger.h"
#import "FBSDKSettings+Internal.h"

@interface FBSDKSystemAccountStoreAdapter ()

@property (retain, nonatomic, readonly) ACAccountStore *accountStore;

@end

static NSString *const FBForceBlockingRenewKey = @"com.facebook.sdk:ForceBlockingRenewKey";
static FBSDKSystemAccountStoreAdapter *_singletonInstance = nil;

@implementation FBSDKSystemAccountStoreAdapter
{
  ACAccountStore *_accountStore;
  ACAccountType *_accountType;
}

+ (void)initialize
{
  if (self == [FBSDKSystemAccountStoreAdapter class]) {
    _singletonInstance = [[self alloc] init];
  }
}

- (instancetype)init
{
  self = [super init];
  if (self) {
    _forceBlockingRenew = [[NSUserDefaults standardUserDefaults] boolForKey:FBForceBlockingRenewKey];
  }
  return self;
}

#pragma mark - Properties

- (ACAccountStore *)accountStore
{
  if (_accountStore == nil) {
    _accountStore = [[fbsdkdfl_ACAccountStoreClass() alloc] init];
  }
  return _accountStore;
}

- (ACAccountType *)accountType
{
  if (_accountType == nil) {
    _accountType = [self.accountStore accountTypeWithAccountTypeIdentifier:@"com.apple.facebook"];
  }
  return _accountType;
}

- (void)setForceBlockingRenew:(BOOL)forceBlockingRenew
{
  if (_forceBlockingRenew != forceBlockingRenew) {
    _forceBlockingRenew = forceBlockingRenew;
    NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
    [userDefaults setBool:forceBlockingRenew forKey:FBForceBlockingRenewKey];
    [userDefaults synchronize];
  }
}

+ (FBSDKSystemAccountStoreAdapter *)sharedInstance
{
  return _singletonInstance;
}

+ (void)setSharedInstance:(FBSDKSystemAccountStoreAdapter *)instance
{
  _singletonInstance = instance;
}

- (NSString *)accessTokenString
{
  if (self.accountType && self.accountType.accessGranted) {
    NSArray *fbAccounts = [self.accountStore accountsWithAccountType:self.accountType];
    if (fbAccounts.count > 0) {
      id account = fbAccounts[0];
      id credential = [account credential];

      return [credential oauthToken];
    }
  }
  return nil;
}

#pragma mark - Public properties and methods

- (void)requestAccessToFacebookAccountStore:(NSSet *)permissions
                            defaultAudience:(NSString *)defaultAudience
                              isReauthorize:(BOOL)isReauthorize
                                      appID:(NSString *)appID
                                    handler:(FBSDKGraphRequestAccessToAccountsHandler)handler
{
  if (appID == nil) {
    @throw [NSException exceptionWithName:NSInvalidArgumentException
                                   reason:@"appID cannot be nil"
                                 userInfo:nil];
  }

  // no publish_* permissions are permitted with a nil audience
  if (!defaultAudience && isReauthorize) {
    for (NSString *p in permissions) {
      if ([p hasPrefix:@"publish"]) {
        [[NSException exceptionWithName:NSInvalidArgumentException
                                 reason:@"FBSDKLoginManager: One or more publish permission was requested "
          @"without specifying an audience; use FBSDKDefaultAudienceOnlyMe, "
          @"FBSDKDefaultAudienceFriends, or FBSDKDefaultAudienceEveryone"
                               userInfo:nil]
         raise];
      }
    }
  }

  // construct access options
  NSDictionary<NSString *, id> *options = @{fbsdkdfl_ACFacebookAppIdKey(): appID,
                                            fbsdkdfl_ACFacebookPermissionsKey(): permissions.allObjects,
                                            fbsdkdfl_ACFacebookAudienceKey(): defaultAudience};

  if (self.forceBlockingRenew
      && [self.accountStore accountsWithAccountType:self.accountType].count > 0) {
    // If the force renew flag is set and an iOS FB account is still set,
    // chain the requestAccessBlock to a successful renew result
    [self renewSystemAuthorization:^(ACAccountCredentialRenewResult result, NSError *error) {
      if (result == ACAccountCredentialRenewResultRenewed) {
        self.forceBlockingRenew = NO;
        [self requestAccessToFacebookAccountStore:options retrying:NO handler:handler];
      } else if (handler) {
        // Otherwise, invoke the caller's handler back on the main thread with an
        // error that will trigger the password change user message.
        dispatch_async(dispatch_get_main_queue(), ^{
          handler(nil, error);
        });
      }
    }];
  } else {
    // Otherwise go ahead and invoke normal request.
    [self requestAccessToFacebookAccountStore:options retrying:NO handler:handler];
  }
}

- (void)requestAccessToFacebookAccountStore:(NSDictionary *)options
                                   retrying:(BOOL)retrying
                                    handler:(FBSDKGraphRequestAccessToAccountsHandler)handler
{
  if (!self.accountType) {
    if (handler) {
      handler(nil, [NSError fbErrorWithCode:FBSDKErrorUnknown message:@"Invalid request to account store"]);
    }
    return;
  }
  // we will attempt an iOS integrated facebook login
  [self.accountStore
   requestAccessToAccountsWithType:self.accountType
   options:options
   completion:^(BOOL granted, NSError *error) {
     if (!granted &&
         error.code == ACErrorPermissionDenied &&
         [error.description rangeOfString:@"remote_app_id does not match stored id"].location != NSNotFound) {

       [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorDeveloperErrors formatString:
        @"System authorization failed:'%@'. This may be caused by a mismatch between"
        @" the bundle identifier and your app configuration on the server"
        @" at developers.facebook.com/apps.",
        error.localizedDescription];
     }

     // requestAccessToAccountsWithType:options:completion: completes on an
     // arbitrary thread; let's process this back on our main thread
     dispatch_async(dispatch_get_main_queue(), ^{
       NSError *accountStoreError = error;
       NSString *oauthToken = nil;
       id account = nil;
       if (granted) {
         NSArray *fbAccounts = [self.accountStore accountsWithAccountType:self.accountType];
         if (fbAccounts.count > 0) {
           account = fbAccounts[0];

           id credential = [account credential];

           oauthToken = [credential oauthToken];
         }
         self.forceBlockingRenew = NO;
       }

       if (!accountStoreError && !oauthToken) {
         if (!retrying) {
           // This can happen as a result of, e.g., restoring from iCloud to a different device. Try once to renew.
           [self renewSystemAuthorization:^(ACAccountCredentialRenewResult renewResult, NSError *renewError) {
             // Call block again, regardless of result -- either we'll get credentials or we'll fail with the
             // exception below. We want to treat failure here the same regardless of whether it was before or after the refresh attempt.
             [self requestAccessToFacebookAccountStore:options retrying:YES handler:handler];
           }];
           return;
         }
         // else call handler with nils.
       }
       handler(oauthToken, accountStoreError);
     });
   }];
}

- (void)renewSystemAuthorization:(void(^)(ACAccountCredentialRenewResult, NSError *))handler
{
  // if the slider has been set to off, renew calls to iOS simply hang, so we must
  // preemptively check for that condition.
  if (self.accountStore && self.accountType && self.accountType.accessGranted) {
    NSArray *fbAccounts = [self.accountStore accountsWithAccountType:self.accountType];
    id account;
    if (fbAccounts && fbAccounts.count > 0 &&
        (account = fbAccounts[0])) {

      FBSDKAccessToken *currentToken = [FBSDKAccessToken currentAccessToken];
      if (![currentToken.tokenString isEqualToString:self.accessTokenString]) {
        currentToken = nil;
      }
      [self.accountStore renewCredentialsForAccount:account completion:^(ACAccountCredentialRenewResult renewResult, NSError *error) {
        if (error) {
          [FBSDKLogger singleShotLogEntry:FBSDKLoggingBehaviorAccessTokens
                                 logEntry:[NSString stringWithFormat:@"renewCredentialsForAccount result:%ld, error: %@",
                                           (long)renewResult,
                                           error]];
        }
        if (renewResult == ACAccountCredentialRenewResultRenewed &&
            currentToken &&
            [currentToken isEqual:[FBSDKAccessToken currentAccessToken]]) {
          // account store renewals can change the stored oauth token so we need to update the currentAccessToken
          // so future comparisons to -[ accessTokenString] work correctly (e.g., error recovery).
          FBSDKAccessToken *updatedToken = [[FBSDKAccessToken alloc] initWithTokenString:self.accessTokenString
                                                                             permissions:currentToken.permissions.allObjects
                                                                     declinedPermissions:currentToken.declinedPermissions.allObjects
                                                                                   appID:currentToken.appID
                                                                                  userID:currentToken.userID
                                                                          expirationDate:[NSDate distantFuture]
                                                                             refreshDate:[NSDate date]
                                                                dataAccessExpirationDate:[NSDate distantFuture]];
          [FBSDKAccessToken setCurrentAccessToken:updatedToken];
        }
        if (handler) {
          handler(renewResult, error);
        }
      }];
      return;
    }
  }

  if (handler) {
    handler(ACAccountCredentialRenewResultFailed, nil);
  }
}

@end
