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

#import "FBSDKAccessTokenCacheV3.h"
#import "FBSDKAccessTokenCacheV3_17.h"
#import "FBSDKAccessTokenCacheV3_21.h"
#import "FBSDKAccessTokenCacheV4.h"

static BOOL g_tryDeprecatedCaches = YES;

@implementation FBSDKAccessTokenCache

- (FBSDKAccessToken*)accessToken
{
  FBSDKAccessToken *token = [[FBSDKAccessTokenCacheV4 alloc] init].accessToken;
  if (token || !g_tryDeprecatedCaches) {
    return token;
  }

  g_tryDeprecatedCaches = NO;
  NSArray *oldCacheClasses = [[self class] deprecatedCacheClasses];
  __block FBSDKAccessToken *oldToken = nil;
  [oldCacheClasses enumerateObjectsUsingBlock:^(Class obj, NSUInteger idx, BOOL *stop) {
    id<FBSDKAccessTokenCaching> cache = [[obj alloc] init];
    oldToken = cache.accessToken;
    if (oldToken) {
      *stop = YES;
      [cache clearCache];
    }
  }];
  if (oldToken) {
    self.accessToken = oldToken;
  }
  return oldToken;
}

- (void)setAccessToken:(FBSDKAccessToken *)token
{
  [[FBSDKAccessTokenCacheV4 alloc] init].accessToken = token;
  if (g_tryDeprecatedCaches) {
    g_tryDeprecatedCaches = NO;
    NSArray *oldCacheClasses = [[self class] deprecatedCacheClasses];
    [oldCacheClasses enumerateObjectsUsingBlock:^(Class obj, NSUInteger idx, BOOL *stop) {
      id<FBSDKAccessTokenCaching> cache = [[obj alloc] init];
        [cache clearCache];
    }];
  }
}

- (void)clearCache
{
  [[[FBSDKAccessTokenCacheV4 alloc] init] clearCache];
}

// used by FBSDKAccessTokenCacheIntegrationTests
+ (void)resetV3CacheChecks
{
  g_tryDeprecatedCaches = YES;
}

+ (NSArray *)deprecatedCacheClasses
{
  return @[ [FBSDKAccessTokenCacheV3_21 class], [FBSDKAccessTokenCacheV3_17 class], [FBSDKAccessTokenCacheV3 class]];
}
@end
