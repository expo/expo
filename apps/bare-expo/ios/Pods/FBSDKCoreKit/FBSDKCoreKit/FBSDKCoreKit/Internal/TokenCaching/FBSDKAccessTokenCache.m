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

#import "FBSDKAccessTokenCache.h"

#import "FBSDKDynamicFrameworkLoader.h"
#import "FBSDKInternalUtility.h"
#import "FBSDKKeychainStore.h"

static NSString *const kFBSDKAccessTokenUserDefaultsKey = @"com.facebook.sdk.v4.FBSDKAccessTokenInformationKey";
static NSString *const kFBSDKAccessTokenKeychainKey = @"com.facebook.sdk.v4.FBSDKAccessTokenInformationKeychainKey";
static NSString *const kFBSDKAccessTokenUUIDKey = @"tokenUUID";
static NSString *const kFBSDKAccessTokenEncodedKey = @"tokenEncoded";

@implementation FBSDKAccessTokenCache
{
  FBSDKKeychainStore *_keychainStore;
}

- (instancetype)init
{
  if ((self = [super init])) {
    NSString *keyChainServiceIdentifier = [NSString stringWithFormat:@"com.facebook.sdk.tokencache.%@", [NSBundle mainBundle].bundleIdentifier];
    _keychainStore = [[FBSDKKeychainStore alloc] initWithService:keyChainServiceIdentifier accessGroup:nil];
  }
  return self;
}

- (FBSDKAccessToken *)accessToken
{
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  NSString *uuid = [defaults objectForKey:kFBSDKAccessTokenUserDefaultsKey];

  NSDictionary<NSString *, id> *dict = [_keychainStore dictionaryForKey:kFBSDKAccessTokenKeychainKey];
  if ([dict[kFBSDKAccessTokenUUIDKey] isKindOfClass:[NSString class]]) {
    // there is a bug while running on simulator that the uuid stored in dict can be NSData,
    // do a type check to make sure it is NSString
    if ([dict[kFBSDKAccessTokenUUIDKey] isEqualToString:uuid]) {
      id tokenData = dict[kFBSDKAccessTokenEncodedKey];
      if ([tokenData isKindOfClass:[NSData class]]) {
        return [NSKeyedUnarchiver unarchiveObjectWithData:tokenData];
      }
    }
  }
  // if the uuid doesn't match (including if there is no uuid in defaults which means uninstalled case)
  // clear the keychain and return nil.
  [self clearCache];
  return nil;
}

- (void)setAccessToken:(FBSDKAccessToken *)token
{
  if (!token) {
    [self clearCache];
    return;
  }
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  NSString *uuid = [defaults objectForKey:kFBSDKAccessTokenUserDefaultsKey];
  if (!uuid) {
    uuid = [NSUUID UUID].UUIDString;
    [defaults setObject:uuid forKey:kFBSDKAccessTokenUserDefaultsKey];
    [defaults synchronize];
  }
  NSData *tokenData = [NSKeyedArchiver archivedDataWithRootObject:token];
  NSDictionary<NSString *, id> *dict = @{
                                         kFBSDKAccessTokenUUIDKey : uuid,
                                         kFBSDKAccessTokenEncodedKey : tokenData
                                         };

  [_keychainStore setDictionary:dict
                         forKey:kFBSDKAccessTokenKeychainKey
                  accessibility:[FBSDKDynamicFrameworkLoader loadkSecAttrAccessibleAfterFirstUnlockThisDeviceOnly]];
}

- (void)clearCache
{
  [_keychainStore setDictionary:nil
                         forKey:kFBSDKAccessTokenKeychainKey
                  accessibility:NULL];
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  [defaults removeObjectForKey:kFBSDKAccessTokenUserDefaultsKey];
  [defaults synchronize];
}
@end
