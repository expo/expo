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

#import "FBSDKAccessTokenExpirer.h"

#import "FBSDKAccessToken.h"
#import "FBSDKApplicationDelegate+Internal.h"
#import "FBSDKInternalUtility.h"

@implementation FBSDKAccessTokenExpirer
{
  NSTimer *_timer;
}

- (instancetype)init
{
  if (self = [super init]) {
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_checkAccessTokenExpirationDate) name:FBSDKAccessTokenDidChangeNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_checkAccessTokenExpirationDate) name:FBSDKApplicationDidBecomeActiveNotification object:nil];
    [self _checkAccessTokenExpirationDate];
  }
  return self;
}

- (void)dealloc
{
  [_timer invalidate];
  _timer = nil;
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)_checkAccessTokenExpirationDate
{
  [_timer invalidate];
  _timer = nil;
  FBSDKAccessToken *accessToken = FBSDKAccessToken.currentAccessToken;
  if (accessToken == nil || accessToken.isExpired) {
    return;
  }
  _timer = [NSTimer scheduledTimerWithTimeInterval:accessToken.expirationDate.timeIntervalSinceNow target:self selector:@selector(_timerDidFire) userInfo:nil repeats:NO];
}

- (void)_timerDidFire
{
  FBSDKAccessToken *accessToken = FBSDKAccessToken.currentAccessToken;
  NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];
  [FBSDKInternalUtility dictionary:userInfo setObject:accessToken forKey:FBSDKAccessTokenChangeNewKey];
  [FBSDKInternalUtility dictionary:userInfo setObject:accessToken forKey:FBSDKAccessTokenChangeOldKey];
  userInfo[FBSDKAccessTokenDidExpireKey] = @YES;

  [[NSNotificationCenter defaultCenter] postNotificationName:FBSDKAccessTokenDidChangeNotification
                                                      object:[FBSDKAccessToken class]
                                                    userInfo:userInfo];
}

@end
