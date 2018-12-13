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


#import "FBSDKGateKeeperManager.h"

#import <objc/runtime.h>

#import <Foundation/Foundation.h>

#import "FBSDKAppEventsUtility.h"
#import "FBSDKGraphRequest+Internal.h"
#import "FBSDKGraphRequest.h"
#import "FBSDKSettings.h"
#import "FBSDKTypeUtility.h"

#define FBSDK_GATEKEEPER_USER_DEFAULTS_KEY @"com.facebook.sdk:gateKeeper%@"

#define FBSDK_GATEKEEPER_APP_GATEKEEPER_EDGE @"mobile_sdk_gk"
#define FBSDK_GATEKEEPER_APP_GATEKEEPER_FIELDS @"gatekeepers"

@implementation FBSDKGateKeeperManager

static NSMutableDictionary<NSString *, id> *_gateKeepers;
static const NSTimeInterval kTimeout = 4.0;
static BOOL _loadingGateKeepers;
static BOOL _requeryFinishedForAppStart;

#pragma mark - Public Class Methods

+ (BOOL)boolForKey:(NSString *)key
             appID:(NSString *)appID
      defaultValue:(BOOL)defaultValue
{
  if (appID == nil || _gateKeepers == nil || _gateKeepers[appID] == nil) {
    return defaultValue;
  }
  NSDictionary<NSString *, id> *gateKeeper = [FBSDKTypeUtility dictionaryValue:_gateKeepers[appID]];
  return gateKeeper[key] == nil ? defaultValue : [gateKeeper[key] boolValue];
}

+ (void)loadGateKeepers
{
  NSString *appID = [FBSDKSettings appID];
  @synchronized(self) {
    if (_gateKeepers == nil) {
      _gateKeepers = [[NSMutableDictionary alloc] init];
    }
    // load the defaults
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSString *defaultKey = [NSString stringWithFormat:FBSDK_GATEKEEPER_USER_DEFAULTS_KEY,
                            appID];
    NSData *data = [defaults objectForKey:defaultKey];
    if ([data isKindOfClass:[NSData class]]) {
      NSMutableDictionary<NSString *, id> *gatekeeper = [NSKeyedUnarchiver unarchiveObjectWithData:data];
      if (gatekeeper != nil && [gatekeeper isKindOfClass:[NSMutableDictionary class]] && appID != nil) {
        [_gateKeepers setObject:gatekeeper forKey:appID];
      }
    }

    if (!_requeryFinishedForAppStart) {
      if (!_loadingGateKeepers) {
        _loadingGateKeepers = YES;
        FBSDKGraphRequest *request = [[self class] requestToLoadGateKeepers:appID];

        // start request with specified timeout instead of the default 180s
        FBSDKGraphRequestConnection *requestConnection = [[FBSDKGraphRequestConnection alloc] init];
        requestConnection.timeout = kTimeout;
        [requestConnection addRequest:request completionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
          _requeryFinishedForAppStart = YES;
          [self processLoadRequestResponse:result error:error appID:appID];
        }];
        [requestConnection start];
      }
    }
  }
}

#pragma mark - Internal Class Methods

+ (FBSDKGraphRequest *)requestToLoadGateKeepers:(NSString *)appID
{
  NSString *sdkVersion = [FBSDKSettings sdkVersion];
  NSString *advertiserID = [FBSDKAppEventsUtility advertiserID];

  NSDictionary<NSString *, NSString *> *parameters = @{ @"platform": @"ios" ,
                                                        @"device_id": advertiserID ?: @"",
                                                        @"sdk_version": sdkVersion,
                                                        @"fields": FBSDK_GATEKEEPER_APP_GATEKEEPER_FIELDS};

  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:[NSString stringWithFormat:@"%@/%@",
                                                                             appID, FBSDK_GATEKEEPER_APP_GATEKEEPER_EDGE]
                                                                 parameters:parameters
                                                                tokenString:nil
                                                                 HTTPMethod:nil
                                                                      flags:FBSDKGraphRequestFlagSkipClientToken | FBSDKGraphRequestFlagDisableErrorRecovery];
  return request;
}

#pragma mark - Helper Class Methods

+ (void)processLoadRequestResponse:(id)result error:(NSError *)error appID:(NSString *)appID
{
  if (error) {
    return;
  }

  NSMutableDictionary<NSString *, id> *gateKeeper = _gateKeepers[appID];
  if (gateKeeper == nil) {
    gateKeeper = [[NSMutableDictionary alloc] init];
  }
  NSDictionary<NSString *, id> *resultDictionary = [FBSDKTypeUtility dictionaryValue:result];
  NSDictionary<NSString *, id> *fetchedData = [FBSDKTypeUtility dictionaryValue:[resultDictionary[@"data"] firstObject]];
  NSArray<id> *gateKeeperList = fetchedData != nil ? [FBSDKTypeUtility arrayValue:fetchedData[FBSDK_GATEKEEPER_APP_GATEKEEPER_FIELDS]] : nil;

  if (gateKeeperList != nil) {
    // updates gate keeper with fetched data
    for (id gateKeeperEntry in gateKeeperList) {
      NSDictionary<NSString *, id> *entry = [FBSDKTypeUtility dictionaryValue:gateKeeperEntry];
      NSString *key = [FBSDKTypeUtility stringValue:[entry objectForKey:@"key"]];
      id value = [entry objectForKey:@"value"];
      if (entry != nil && key != nil && value != nil) {
        [gateKeeper setObject: value forKey:key];
      }
    }
    [_gateKeepers setObject:gateKeeper forKey:appID];

  }

  // update the cached copy in user defaults
  NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
  NSString *defaultKey = [NSString stringWithFormat:FBSDK_GATEKEEPER_USER_DEFAULTS_KEY,
                          appID];
  NSData *data = [NSKeyedArchiver archivedDataWithRootObject:gateKeeper];
  [defaults setObject:data forKey:defaultKey];
}

@end
