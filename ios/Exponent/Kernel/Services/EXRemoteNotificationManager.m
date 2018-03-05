// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernel.h"
#import "EXProvisioningProfile.h"
#import "EXRemoteNotificationManager.h"
#import "EXShellManager.h"

#import <React/RCTUtils.h>

NSString * const kEXCurrentAPNSTokenDefaultsKey = @"EXCurrentAPNSTokenDefaultsKey";

@implementation NSData (EXRemoteNotification)

- (NSString *)apnsTokenString
{
  NSCharacterSet *brackets = [NSCharacterSet characterSetWithCharactersInString:@"<>"];
  return [[[self description] stringByTrimmingCharactersInSet:brackets] stringByReplacingOccurrencesOfString:@" " withString:@""];
}

@end

@interface EXRemoteNotificationManager ()

@property (nonatomic, assign) BOOL isLatestTokenPosted;
@property (nonatomic, assign) BOOL isPostingToken;
@property (nonatomic, assign) BOOL isKernelJSLoaded;

@end

@implementation EXRemoteNotificationManager

- (instancetype)init
{
  if (self = [super init]) {
    _isLatestTokenPosted = NO;
    _isPostingToken = NO;
    _isKernelJSLoaded = NO;
  }
  return self;
}

- (void)registerForRemoteNotifications
{
  if ([self _disableDetachedPushNotifications]) {
    // don't register, because the detached app may not be built with APNS entitlements,
    // and in that case this method would actually be bad to call. (not just a no-op.)
    DDLogWarn(@"Expo Remote Notification services won't work in an ExpoKit app because Expo can not manage your APNS certificates.");
  } else {
    [RCTSharedApplication() registerForRemoteNotifications];
  }
}

- (void)registerAPNSToken:(NSData *)token
{
  if (token) {
    _isLatestTokenPosted = NO;
    [[NSUserDefaults standardUserDefaults] setObject:token forKey:kEXCurrentAPNSTokenDefaultsKey];
    [[NSUserDefaults standardUserDefaults] synchronize];

    [self _maybePostAPNSToken];
  } else {
    _isLatestTokenPosted = YES;
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:kEXCurrentAPNSTokenDefaultsKey];
    [[NSUserDefaults standardUserDefaults] synchronize];
  }
}

- (void)handleRemoteNotification:(NSDictionary *)notification fromBackground:(BOOL)isFromBackground
{
  if ([EXShellManager sharedInstance].isDetached) {
    DDLogWarn(@"Expo Remote Notification services won't work in an ExpoKit app because Expo can not manage your APNS certificates.");
  }
  if (notification) {
    NSDictionary *body = [notification objectForKey:@"body"];
    NSString *experienceId = [notification objectForKey:@"experienceId"];
    if (experienceId) {
      // Let the kernel rely on the presence of a body
      if (!body) {
        body = @{};
      }
      [[EXKernel sharedInstance] sendNotification:body
                               toExperienceWithId:experienceId
                                   fromBackground:isFromBackground
                                         isRemote:YES];
    }
  }
}

- (NSString *)apnsTokenString
{
  NSData *maybeToken = [self _apnsTokenFromUserDefaults];
  if (maybeToken) {
    return [maybeToken apnsTokenString];
  }
  return nil;
}

#pragma mark - scoped module delegate

- (NSString *)apnsTokenStringForScopedModule:(__unused id)scopedModule
{
  return [self apnsTokenString];
}

- (void)getExpoPushTokenForScopedModule:(id)scopedModule success:(void (^)(NSDictionary *))success failure:(void (^)(NSString *))failure
{
  [self _getExpoPushTokenForExperienceId:((EXScopedBridgeModule *)scopedModule).experienceId success:success failure:failure];
}

#pragma mark - Internal

- (NSData *)_apnsTokenFromUserDefaults
{
  return [[NSUserDefaults standardUserDefaults] objectForKey:kEXCurrentAPNSTokenDefaultsKey];
}

- (void)_onKernelJSLoaded
{
  // TODO: ben: push
  _isKernelJSLoaded = YES;
  [self _maybePostAPNSToken];
}

// TODO: call this when reachability changes
- (void)_maybePostAPNSToken
{
  if (!_isLatestTokenPosted && _isKernelJSLoaded) {
    NSData *token = [self _apnsTokenFromUserDefaults];
    if (token && !_isPostingToken) {
      _isPostingToken = YES;
      NSDictionary *eventParams = @{
        @"deviceToken": [token apnsTokenString],
        @"deviceId": [EXKernel deviceInstallUUID],
        @"appId": [NSBundle mainBundle].bundleIdentifier,
        @"development": @([EXProvisioningProfile mainProvisioningProfile].development),
      };
      __weak typeof(self) weakSelf = self;
      // TODO: ben: notifs
      /* [[EXKernel sharedInstance] dispatchKernelJSEvent:@"updateDeviceToken" body:eventParams onSuccess:^(NSDictionary *result) {
        weakSelf.isLatestTokenPosted = YES;
        weakSelf.isPostingToken = NO;
      } onFailure:^(NSString *message) {
        DDLogInfo(@"Failed to post APNS token: %@", message);
        weakSelf.isPostingToken = NO;
      }]; */
    }
  }
}

- (void)_getExpoPushTokenForExperienceId:(NSString *)experienceId success:(void (^)(NSDictionary *))success failure:(void (^)(NSString *))failure
{
  NSDictionary *eventParams = @{
                                @"experienceId": experienceId,
                                  @"deviceId": [EXKernel deviceInstallUUID],
                                };
  // TODO: ben: notifs
  // [[EXKernel sharedInstance] dispatchKernelJSEvent:@"getExponentPushToken" body:eventParams onSuccess:success onFailure:failure];
}

- (BOOL)_disableDetachedPushNotifications
{
  BOOL isDetached = [EXShellManager sharedInstance].isDetached, isDetachedService = NO;
#ifdef EX_DETACHED_SERVICE
  isDetachedService = YES;
#endif
  return (isDetached && !isDetachedService);
}

@end
