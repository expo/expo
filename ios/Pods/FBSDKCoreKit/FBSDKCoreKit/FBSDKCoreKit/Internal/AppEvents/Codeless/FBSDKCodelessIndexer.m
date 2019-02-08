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

#import "FBSDKCodelessIndexer.h"

#import <objc/runtime.h>
#import <sys/sysctl.h>
#import <sys/utsname.h>

#import <UIKit/UIKit.h>

#import <FBSDKCoreKit/FBSDKGraphRequest.h>
#import <FBSDKCoreKit/FBSDKSettings.h>

#import "FBSDKCoreKit+Internal.h"

@implementation FBSDKCodelessIndexer

static BOOL _isCodelessIndexing;
static BOOL _isCheckingSession;
static BOOL _isCodelessIndexingEnabled;

static NSMutableDictionary<NSString *, id> *_codelessSetting;
static const NSTimeInterval kTimeout = 4.0;

static NSString *_deviceSessionID;
static NSTimer *_appIndexingTimer;
static NSString *_lastTreeHash;

+ (void)load
{
#if TARGET_OS_SIMULATOR
  [self setupGesture];
#else
  [self loadCodelessSettingWithCompletionBlock:^(BOOL isCodelessSetupEnabled, NSError *error) {
    if (isCodelessSetupEnabled) {
      [self setupGesture];
    }
  }];
#endif
}

// DO NOT call this function, it is only called once in the load function
+ (void)loadCodelessSettingWithCompletionBlock:(FBSDKCodelessSettingLoadBlock)completionBlock
{
  NSString *appID = [FBSDKSettings appID];
  if (appID == nil) {
    return;
  }

  [FBSDKServerConfigurationManager loadServerConfigurationWithCompletionBlock:^(FBSDKServerConfiguration *serverConfiguration, NSError *serverConfigurationLoadingError) {
    if (!serverConfiguration.codelessEventsEnabled) {
      return;
    }

    // load the defaults
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSString *defaultKey = [NSString stringWithFormat:CODELESS_SETTING_KEY, appID];
    NSData *data = [defaults objectForKey:defaultKey];
    if ([data isKindOfClass:[NSData class]]) {
      NSMutableDictionary<NSString *, id> *codelessSetting = [NSKeyedUnarchiver unarchiveObjectWithData:data];
      if (codelessSetting) {
        _codelessSetting = codelessSetting;
      }
    }
    if (!_codelessSetting) {
      _codelessSetting = [[NSMutableDictionary alloc] init];
    }

    if (![self _codelessSetupTimestampIsValid:[_codelessSetting objectForKey:CODELESS_SETTING_TIMESTAMP_KEY]]) {
      FBSDKGraphRequest *request = [self requestToLoadCodelessSetup:appID];
      if (request == nil) {
        return;
      }
      FBSDKGraphRequestConnection *requestConnection = [[FBSDKGraphRequestConnection alloc] init];
      requestConnection.timeout = kTimeout;
      [requestConnection addRequest:request completionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *codelessLoadingError) {
        if (codelessLoadingError) {
          return;
        }

        NSDictionary<NSString *, id> *resultDictionary = [FBSDKTypeUtility dictionaryValue:result];
        if (resultDictionary) {
          BOOL isCodelessSetupEnabled = [FBSDKTypeUtility boolValue:resultDictionary[CODELESS_SETUP_ENABLED_FIELD]];
          [_codelessSetting setObject:@(isCodelessSetupEnabled) forKey:CODELESS_SETUP_ENABLED_KEY];
          [_codelessSetting setObject:[NSDate date] forKey:CODELESS_SETTING_TIMESTAMP_KEY];
          // update the cached copy in user defaults
          [defaults setObject:[NSKeyedArchiver archivedDataWithRootObject:_codelessSetting] forKey:defaultKey];
          completionBlock(isCodelessSetupEnabled, codelessLoadingError);
        }
      }];
      [requestConnection start];
    } else {
      completionBlock([FBSDKTypeUtility boolValue:[_codelessSetting objectForKey:CODELESS_SETUP_ENABLED_KEY]], nil);
    }
  }];
}

+ (FBSDKGraphRequest *)requestToLoadCodelessSetup:(NSString *)appID
{
  NSString *advertiserID = [FBSDKAppEventsUtility advertiserID];
  if (!advertiserID) {
    return nil;
  }

  NSDictionary<NSString *, NSString *> *parameters = @{
                                                       @"fields": CODELESS_SETUP_ENABLED_FIELD,
                                                       @"advertiser_id": advertiserID
                                                       };

  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc] initWithGraphPath:appID
                                                                 parameters:parameters
                                                                tokenString:nil
                                                                 HTTPMethod:nil
                                                                      flags:FBSDKGraphRequestFlagSkipClientToken | FBSDKGraphRequestFlagDisableErrorRecovery];
  return request;
}

+ (BOOL)_codelessSetupTimestampIsValid:(NSDate *)timestamp
{
  return (timestamp != nil && [[NSDate date] timeIntervalSinceDate:timestamp] < CODELESS_SETTING_CACHE_TIMEOUT);
}

+ (void)setupGesture
{
  [UIApplication sharedApplication].applicationSupportsShakeToEdit = YES;
  Class class = [UIApplication class];

  [FBSDKSwizzler swizzleSelector:@selector(motionBegan:withEvent:) onClass:class withBlock:^{
    if ([FBSDKServerConfigurationManager cachedServerConfiguration].isCodelessEventsEnabled) {
      [self checkCodelessIndexingSession];
    }
  } named:@"motionBegan"];
}

+ (void)checkCodelessIndexingSession
{
  if (_isCheckingSession) return;

  _isCheckingSession = YES;
  NSDictionary *parameters = @{
                               CODELESS_INDEXING_SESSION_ID_KEY: [self currentSessionDeviceID],
                               CODELESS_INDEXING_EXT_INFO_KEY: [self extInfo]
                               };
  FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                                initWithGraphPath:[NSString stringWithFormat:@"%@/%@",
                                                   [FBSDKSettings appID], CODELESS_INDEXING_SESSION_ENDPOINT]
                                parameters: parameters
                                HTTPMethod:@"POST"];
  [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
    _isCheckingSession = NO;
    if ([result isKindOfClass:[NSDictionary class]]) {
      _isCodelessIndexingEnabled = [((NSDictionary *)result)[CODELESS_INDEXING_STATUS_KEY] boolValue];
      if (_isCodelessIndexingEnabled) {
        _lastTreeHash = nil;
        if (!_appIndexingTimer) {
          _appIndexingTimer = [NSTimer timerWithTimeInterval:CODELESS_INDEXING_UPLOAD_INTERVAL_IN_SECONDS
                                                target:self
                                              selector:@selector(startIndexing)
                                              userInfo:nil
                                               repeats:YES];

          [[NSRunLoop mainRunLoop] addTimer:_appIndexingTimer forMode:NSDefaultRunLoopMode];
        }
      } else {
        _deviceSessionID = nil;
      }
    }
  }];
}

+ (NSString *)currentSessionDeviceID
{
  if (!_deviceSessionID) {
    _deviceSessionID = [NSUUID UUID].UUIDString;
  }
  return _deviceSessionID;
}

+ (NSString *)extInfo
{
  struct utsname systemInfo;
  uname(&systemInfo);
  NSString *machine = @(systemInfo.machine);
  NSString *advertiserID = [FBSDKAppEventsUtility advertiserID] ?: @"";
  machine = machine ?: @"";
  NSString *debugStatus = [FBSDKAppEventsUtility isDebugBuild] ? @"1" : @"0";
#if TARGET_IPHONE_SIMULATOR
  NSString *isSimulator = @"1";
#else
  NSString *isSimulator = @"0";
#endif
  NSLocale *locale = [NSLocale currentLocale];
  NSString *languageCode = [locale objectForKey:NSLocaleLanguageCode];
  NSString *countryCode = [locale objectForKey:NSLocaleCountryCode];
  NSString *localeString = locale.localeIdentifier;
  if (languageCode && countryCode) {
    localeString = [NSString stringWithFormat:@"%@_%@", languageCode, countryCode];
  }

  NSString *extinfo = [FBSDKInternalUtility JSONStringForObject:@[machine,
                                                                  advertiserID,
                                                                  debugStatus,
                                                                  isSimulator,
                                                                  localeString]
                                                          error:NULL
                                           invalidObjectHandler:NULL];

  return extinfo ?: @"";
}

+ (void)startIndexing {
  if (!_isCodelessIndexingEnabled) {
    return;
  }

  if (UIApplicationStateActive != [UIApplication sharedApplication].applicationState) {
    return;
  }

  // If userAgentSuffix begins with Unity, trigger unity code to upload view hierarchy
  NSString *userAgentSuffix = [FBSDKSettings userAgentSuffix];
  if (userAgentSuffix != nil && [userAgentSuffix hasPrefix:@"Unity"]) {
    Class FBUnityUtility = objc_lookUpClass("FBUnityUtility");
    SEL selector = NSSelectorFromString(@"triggerUploadViewHierarchy");
    if (FBUnityUtility && selector && [FBUnityUtility respondsToSelector:selector]) {
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Warc-performSelector-leaks"
      [FBUnityUtility performSelector:selector];
#pragma clang diagnostic pop
    }
  } else {
    [self uploadIndexing];
  }
}

+ (void)uploadIndexing
{
  if (_isCodelessIndexing) {
        return;
  }

  NSString *tree = [FBSDKCodelessIndexer currentViewTree];

  [self uploadIndexing:tree];
}

+ (void)uploadIndexing:(NSString *)tree
{
    if (_isCodelessIndexing) {
        return;
    }

    if (!tree) {
        return;
    }

    NSString *currentTreeHash = [FBSDKUtility SHA256Hash:tree];
    if (_lastTreeHash && [_lastTreeHash isEqualToString:currentTreeHash]) {
        return;
    }

    _lastTreeHash = currentTreeHash;

    NSBundle *mainBundle = [NSBundle mainBundle];
    NSString *version = [mainBundle objectForInfoDictionaryKey:@"CFBundleShortVersionString"];

    FBSDKGraphRequest *request = [[FBSDKGraphRequest alloc]
                                  initWithGraphPath:[NSString stringWithFormat:@"%@/%@",
                                                     [FBSDKSettings appID], CODELESS_INDEXING_ENDPOINT]
                                  parameters:@{
                                               CODELESS_INDEXING_TREE_KEY: tree,
                                               CODELESS_INDEXING_APP_VERSION_KEY: version ?: @"",
                                               CODELESS_INDEXING_PLATFORM_KEY: @"iOS",
                                               CODELESS_INDEXING_SESSION_ID_KEY: [self currentSessionDeviceID]
                                               }
                                  HTTPMethod:@"POST"];
    _isCodelessIndexing = YES;
    [request startWithCompletionHandler:^(FBSDKGraphRequestConnection *connection, id result, NSError *error) {
        _isCodelessIndexing = NO;
        if ([result isKindOfClass:[NSDictionary class]]) {
            _isCodelessIndexingEnabled = [result[CODELESS_INDEXING_STATUS_KEY] boolValue];
            if (!_isCodelessIndexingEnabled) {
                _deviceSessionID = nil;
            }
        }
    }];
}

+ (NSString *)currentViewTree
{
  NSMutableArray *trees = [NSMutableArray array];

  NSArray *windows = [UIApplication sharedApplication].windows;
  for (UIWindow *window in windows) {
    NSDictionary *tree = [FBSDKCodelessIndexer recursiveCaptureTree:window];
    if (tree) {
      if (window.isKeyWindow) {
        [trees insertObject:tree atIndex:0];
      } else {
        [trees addObject:tree];
      }
    }
  }

  if (0 == trees.count) {
    return nil;
  }

  NSArray *viewTrees = [trees reverseObjectEnumerator].allObjects;

  NSData *data = UIImageJPEGRepresentation([FBSDKCodelessIndexer screenshot], 0.5);
  NSString *screenshot = [data base64EncodedStringWithOptions:0];

  NSMutableDictionary *treeInfo = [NSMutableDictionary dictionary];

  treeInfo[@"view"] = viewTrees;
  treeInfo[@"screenshot"] = screenshot ?: @"";

  NSString *tree = nil;
  data = [NSJSONSerialization dataWithJSONObject:treeInfo options:0 error:nil];
  if (data) {
    tree = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
  }

  return tree;
}

+ (NSDictionary<NSString *, id> *)recursiveCaptureTree:(NSObject *)obj
{
  if (!obj) {
    return nil;
  }

  NSMutableDictionary *result = [FBSDKViewHierarchy getDetailAttributesOf:obj];

  NSArray *children = [FBSDKViewHierarchy getChildren:obj];
  NSMutableArray *childrenTrees = [NSMutableArray array];
  for (NSObject *child in children) {
    NSDictionary *objTree = [self recursiveCaptureTree:child];
    [childrenTrees addObject:objTree];
  }

  if (childrenTrees.count > 0) {
    [result setValue:[childrenTrees copy] forKey:CODELESS_VIEW_TREE_CHILDREN_KEY];
  }

  return [result copy];
}

+ (UIImage *)screenshot {
  UIWindow *window = [UIApplication sharedApplication].delegate.window;

  UIGraphicsBeginImageContext(window.bounds.size);
  [window drawViewHierarchyInRect:window.bounds afterScreenUpdates:YES];
  UIImage *image = UIGraphicsGetImageFromCurrentImageContext();
  UIGraphicsEndImageContext();

  return image;
}

+ (NSDictionary<NSString *, NSNumber *> *)dimensionOf:(NSObject *)obj
{
  UIView *view = nil;

  if ([obj isKindOfClass:[UIView class]]) {
    view = (UIView *)obj;
  } else if ([obj isKindOfClass:[UIViewController class]]) {
    view = ((UIViewController *)obj).view;
  }

  CGRect frame = view.frame;
  CGPoint offset = CGPointZero;

  if ([view isKindOfClass:[UIScrollView class]])
    offset = ((UIScrollView *)view).contentOffset;

  return @{
           CODELESS_VIEW_TREE_TOP_KEY: @((int)frame.origin.y),
           CODELESS_VIEW_TREE_LEFT_KEY: @((int)frame.origin.x),
           CODELESS_VIEW_TREE_WIDTH_KEY: @((int)frame.size.width),
           CODELESS_VIEW_TREE_HEIGHT_KEY: @((int)frame.size.height),
           CODELESS_VIEW_TREE_OFFSET_X_KEY: @((int)offset.x),
           CODELESS_VIEW_TREE_OFFSET_Y_KEY: @((int)offset.y),
           CODELESS_VIEW_TREE_VISIBILITY_KEY: view.isHidden ? @4 : @0
           };
}

@end
