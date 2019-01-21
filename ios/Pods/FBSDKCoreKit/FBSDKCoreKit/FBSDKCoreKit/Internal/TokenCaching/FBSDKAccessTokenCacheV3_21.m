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

#import "FBSDKAccessTokenCacheV3_21.h"

#import "FBSDKAccessToken.h"
#import "FBSDKAccessTokenCacheV3.h"
#import "FBSDKDynamicFrameworkLoader.h"
#import "FBSDKKeychainStore.h"
#import "FBSDKSettings.h"

@implementation FBSDKAccessTokenCacheV3_21
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
  NSString *uuidKey = [[FBSDKSettings legacyUserDefaultTokenInformationKeyName] stringByAppendingString:@"UUID"];
  NSString *uuid = [defaults objectForKey:uuidKey];
  NSDictionary *tokenDictionary = [_keychainStore dictionaryForKey:[FBSDKSettings legacyUserDefaultTokenInformationKeyName]];
  if (![tokenDictionary[FBSDKTokenInformationUUIDKey] isEqualToString:uuid]) {
    [self clearCache];
  }

  return [FBSDKAccessTokenCacheV3 accessTokenForV3Dictionary:tokenDictionary];
}

- (void)clearCache
{
  [_keychainStore setDictionary:nil forKey:[FBSDKSettings legacyUserDefaultTokenInformationKeyName] accessibility:nil];
}

- (void)setAccessToken:(FBSDKAccessToken *)token
{
  //no-op.
  NSAssert(NO, @"deprecated cache FBSDKAccessTokenCacheV3_21 should not be used to cache a token");
}


@end
