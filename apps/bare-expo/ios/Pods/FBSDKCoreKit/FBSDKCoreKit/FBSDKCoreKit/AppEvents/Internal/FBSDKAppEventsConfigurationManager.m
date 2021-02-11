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

#import "FBSDKAppEventsConfigurationManager.h"

#import "FBSDKCoreKit+Internal.h"

static NSString *const FBSDKAppEventsConfigurationKey = @"com.facebook.sdk:FBSDKAppEventsConfiguration";
static NSString *const FBSDKAppEventsConfigurationTimestampKey = @"com.facebook.sdk:FBSDKAppEventsConfigurationTimestamp";
static const NSTimeInterval kTimeout = 4.0;

static FBSDKAppEventsConfiguration *g_configuration;
static NSMutableArray *g_completionBlocks;
static NSDate *g_timestamp;
static BOOL g_requeryFinishedForAppStart;
static BOOL g_loadingConfiguration;

@implementation FBSDKAppEventsConfigurationManager

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
+ (void)initialize
{
  if (self == FBSDKAppEventsConfigurationManager.class) {
    id data = [[NSUserDefaults standardUserDefaults] objectForKey:FBSDKAppEventsConfigurationKey];
    if ([data isKindOfClass:NSData.class]) {
      g_configuration = [NSKeyedUnarchiver unarchiveObjectWithData:data];
    }
    if (!g_configuration) {
      g_configuration = [FBSDKAppEventsConfiguration defaultConfiguration];
    }
    g_completionBlocks = [NSMutableArray new];
    g_timestamp = [[NSUserDefaults standardUserDefaults] objectForKey:FBSDKAppEventsConfigurationTimestampKey];
  }
}

#pragma clang diagnostic pop

+ (FBSDKAppEventsConfiguration *)cachedAppEventsConfiguration
{
  return g_configuration;
}

+ (void)loadAppEventsConfigurationWithBlock:(FBSDKAppEventsConfigurationManagerBlock)block
{
  NSString *appID = [FBSDKSettings appID];
  @synchronized(self) {
    [FBSDKTypeUtility array:g_completionBlocks addObject:block];
    if (!appID || (g_requeryFinishedForAppStart && [self _isTimestampValid])) {
      for (FBSDKAppEventsConfigurationManagerBlock completionBlock in g_completionBlocks) {
        completionBlock();
      }
      [g_completionBlocks removeAllObjects];
      return;
    }
    if (g_loadingConfiguration) {
      return;
    }
    g_loadingConfiguration = true;
    FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                                  initWithGraphPath:appID
                                  parameters:@{
                                    @"fields" : [NSString stringWithFormat:@"app_events_config.os_version(%@)", [UIDevice currentDevice].systemVersion]
                                  }];
    FBSDKGraphRequestConnection *requestConnection = [FBSDKGraphRequestConnection new];
    requestConnection.timeout = kTimeout;
    [requestConnection addRequest:request completionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
      [self _processResponse:result error:error];
    }];
    [requestConnection start];
  }
}

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
+ (void)_processResponse:(id)response
                   error:(NSError *)error
{
  NSDate *date = [NSDate date];
  @synchronized(self) {
    g_loadingConfiguration = NO;
    g_requeryFinishedForAppStart = YES;
    if (error) {
      return;
    }
    g_configuration = [[FBSDKAppEventsConfiguration alloc] initWithJSON:response];
    g_timestamp = date;
    for (FBSDKAppEventsConfigurationManagerBlock completionBlock in g_completionBlocks) {
      completionBlock();
    }
    [g_completionBlocks removeAllObjects];
  }
  NSData *data = [NSKeyedArchiver archivedDataWithRootObject:g_configuration];
  [[NSUserDefaults standardUserDefaults] setObject:data forKey:FBSDKAppEventsConfigurationKey];
  [[NSUserDefaults standardUserDefaults] setObject:date forKey:FBSDKAppEventsConfigurationTimestampKey];
}

#pragma clang diagnostic pop

+ (BOOL)_isTimestampValid
{
  return g_timestamp && [[NSDate date] timeIntervalSinceDate:g_timestamp] < 3600;
}

@end
