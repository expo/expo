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
#import "FBSDKInternalUtility.h"
#import "FBSDKSettings.h"
#import "FBSDKTypeUtility.h"

#define FBSDK_GATEKEEPERS_USER_DEFAULTS_KEY @"com.facebook.sdk:GateKeepers%@"

#define FBSDK_GATEKEEPER_APP_GATEKEEPER_EDGE @"mobile_sdk_gk"
#define FBSDK_GATEKEEPER_APP_GATEKEEPER_FIELDS @"gatekeepers"

@implementation FBSDKGateKeeperManager

static NSDictionary<NSString *, id> *_gateKeepers;
static NSMutableArray *_completionBlocks;
static const NSTimeInterval kTimeout = 4.0;
static NSDate *_timestamp;
static BOOL _loadingGateKeepers;
static BOOL _requeryFinishedForAppStart;

#pragma mark - Public Class Methods
+ (void)initialize
{
  if (self == [FBSDKGateKeeperManager class]) {
    _completionBlocks = [NSMutableArray array];
  }
}

+ (BOOL)boolForKey:(NSString *)key defaultValue:(BOOL)defaultValue
{
  [self loadGateKeepers:nil];

  return _gateKeepers[key] ? [_gateKeepers[key] boolValue] : defaultValue;
}

+ (void)loadGateKeepers:(FBSDKGKManagerBlock)completionBlock
{
  @synchronized(self) {
    NSString *appID = [FBSDKSettings appID];
    if (!appID) {
      _gateKeepers = nil;
      if (completionBlock != NULL) {
        completionBlock(nil);
      }
      return;
    }

    if (!_gateKeepers) {
      // load the defaults
      NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
      NSString *defaultKey = [NSString stringWithFormat:FBSDK_GATEKEEPERS_USER_DEFAULTS_KEY,
                              appID];
      NSData *data = [defaults objectForKey:defaultKey];
      if ([data isKindOfClass:[NSData class]]) {
        NSDictionary<NSString *, id> *gatekeeper = [NSKeyedUnarchiver unarchiveObjectWithData:data];
        if (gatekeeper != nil && [gatekeeper isKindOfClass:[NSDictionary class]]) {
          _gateKeepers = gatekeeper;
        }
      }
    }

    // Query the server when the requery is not finished for app start or the timestamp is not valid
    if ([self _gateKeeperIsValid]) {
      if (completionBlock) {
        completionBlock(nil);
      }
    } else {
      [FBSDKBasicUtility array:_completionBlocks addObject:completionBlock];
      if (!_loadingGateKeepers) {
        _loadingGateKeepers = YES;
        FBSDKGraphRequest *request = [[self class] requestToLoadGateKeepers];

        // start request with specified timeout instead of the default 180s
        FBSDKGraphRequestConnection *requestConnection = [[FBSDKGraphRequestConnection alloc] init];
        requestConnection.timeout = kTimeout;
        [requestConnection addRequest:request completionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
          _requeryFinishedForAppStart = YES;
          [self processLoadRequestResponse:result error:error];
        }];
        [requestConnection start];
      }
    }
  }
}

#pragma mark - Internal Class Methods

+ (FBSDKGraphRequest *)requestToLoadGateKeepers
{
  NSString *sdkVersion = [FBSDKSettings sdkVersion];

  NSDictionary<NSString *, NSString *> *parameters = @{ @"platform": @"ios" ,
                                                        @"sdk_version": sdkVersion,
                                                        @"fields": FBSDK_GATEKEEPER_APP_GATEKEEPER_FIELDS};

  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:[NSString stringWithFormat:@"%@/%@",
                                                                             [FBSDKSettings appID], FBSDK_GATEKEEPER_APP_GATEKEEPER_EDGE]
                                                                 parameters:parameters
                                                                tokenString:nil
                                                                 HTTPMethod:nil
                                                                      flags:FBSDKGraphRequestFlagSkipClientToken | FBSDKGraphRequestFlagDisableErrorRecovery];
  return request;
}

#pragma mark - Helper Class Methods

+ (void)processLoadRequestResponse:(id)result error:(NSError *)error
{
  @synchronized(self) {
    _loadingGateKeepers = NO;

    if (!error) {
      // Update the timestamp only when there is no error
      _timestamp = [NSDate date];

      NSMutableDictionary<NSString *, id> *gateKeeper = [_gateKeepers mutableCopy];
      if (!gateKeeper) {
        gateKeeper = [[NSMutableDictionary alloc] init];
      }
      NSDictionary<NSString *, id> *resultDictionary = [FBSDKTypeUtility dictionaryValue:result];
      NSDictionary<NSString *, id> *fetchedData = [FBSDKTypeUtility dictionaryValue:[resultDictionary[@"data"] firstObject]];
      NSArray<id> *gateKeeperList = fetchedData != nil ? [FBSDKTypeUtility arrayValue:fetchedData[FBSDK_GATEKEEPER_APP_GATEKEEPER_FIELDS]] : nil;

      if (gateKeeperList != nil) {
        // updates gate keeper with fetched data
        for (id gateKeeperEntry in gateKeeperList) {
          NSDictionary<NSString *, id> *entry = [FBSDKTypeUtility dictionaryValue:gateKeeperEntry];
          NSString *key = [FBSDKTypeUtility stringValue:entry[@"key"]];
          id value = entry[@"value"];
          if (entry != nil && key != nil && value != nil) {
            gateKeeper[key] = value;
          }
        }
        _gateKeepers = [gateKeeper copy];
      }

      // update the cached copy in user defaults
      NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
      NSString *defaultKey = [NSString stringWithFormat:FBSDK_GATEKEEPERS_USER_DEFAULTS_KEY,
                              [FBSDKSettings appID]];
      NSData *data = [NSKeyedArchiver archivedDataWithRootObject:gateKeeper];
      [defaults setObject:data forKey:defaultKey];
    }

    [self _didProcessGKFromNetwork:error];
  }
}

+ (void)_didProcessGKFromNetwork:(NSError *)error
{
  NSArray *completionBlocks = [NSArray arrayWithArray:_completionBlocks];
  [_completionBlocks removeAllObjects];
  for (FBSDKGKManagerBlock completionBlock in completionBlocks) {
    completionBlock(error);
  }
}

+ (BOOL)_gateKeeperTimestampIsValid:(NSDate *)timestamp
{
  if (timestamp == nil) {
    return NO;
  }
  return ([[NSDate date] timeIntervalSinceDate:timestamp] < FBSDK_GATEKEEPER_MANAGER_CACHE_TIMEOUT);
}

+ (BOOL)_gateKeeperIsValid
{
  if (_requeryFinishedForAppStart && (_timestamp && [self _gateKeeperTimestampIsValid:_timestamp])) {
    return YES;
  }
  return NO;
}

@end
