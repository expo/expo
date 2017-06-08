// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernel.h"
#import "EXKernelModule.h"
#import "EXProvisioningProfile.h"
#import "EXRemoteNotificationManager.h"

#import <React/RCTUtils.h>

NSString * const kEXCurrentAPNSTokenDefaultsKey = @"EXCurrentAPNSTokenDefaultsKey";

@implementation NSUserDefaults (EXRemoteNotification)

- (NSData *)apnsToken {
  return [self objectForKey:kEXCurrentAPNSTokenDefaultsKey];
}

@end

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

+ (instancetype)sharedInstance
{
  static EXRemoteNotificationManager *theManager;
  static dispatch_once_t once;
  dispatch_once(&once, ^{
    if (!theManager) {
      theManager = [[EXRemoteNotificationManager alloc] init];
    }
  });
  return theManager;
}

- (instancetype)init
{
  if (self = [super init]) {
    _isLatestTokenPosted = NO;
    _isPostingToken = NO;
    _isKernelJSLoaded = NO;
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(_onKernelJSLoaded) name:kEXKernelJSIsLoadedNotification object:nil];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(_handleGetPushToken:)
                                                 name:kEXKernelGetPushTokenNotification
                                               object:nil];
  }
  return self;
}

- (void)registerForRemoteNotifications
{
  [RCTSharedApplication() registerForRemoteNotifications];
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
#ifdef EX_DETACHED
  DDLogWarn(@"Expo Remote Notification services won't work in an ExpoKit app because Expo can not manage your APNS certificates.");
#endif
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

#pragma mark - Internal

- (void)_onKernelJSLoaded
{
  _isKernelJSLoaded = YES;
  [self _maybePostAPNSToken];
}

// TODO: call this when reachability changes
- (void)_maybePostAPNSToken
{
  if (!_isLatestTokenPosted && _isKernelJSLoaded) {
    NSData *token = [[NSUserDefaults standardUserDefaults] apnsToken];
    if (token && !_isPostingToken) {
      _isPostingToken = YES;
      NSDictionary *eventParams = @{
        @"deviceToken": [token apnsTokenString],
        @"deviceId": [EXKernel deviceInstallUUID],
        @"appId": [NSBundle mainBundle].bundleIdentifier,
        @"development": @([EXProvisioningProfile mainProvisioningProfile].development),
      };
      __weak typeof(self) weakSelf = self;
      [[EXKernel sharedInstance] dispatchKernelJSEvent:@"updateDeviceToken" body:eventParams onSuccess:^(NSDictionary *result) {
        weakSelf.isLatestTokenPosted = YES;
        weakSelf.isPostingToken = NO;
      } onFailure:^(NSString *message) {
        DDLogInfo(@"Failed to post APNS token: %@", message);
        weakSelf.isPostingToken = NO;
      }];
    }
  }
}

- (void)_handleGetPushToken: (NSNotification *)notif
{
  if (notif && notif.userInfo) {
    void (^success)(NSDictionary *) = [notif.userInfo objectForKey:@"onSuccess"];
    void (^failure)(NSString *) = [notif.userInfo objectForKey:@"onFailure"];
    NSDictionary *eventParams = @{
                                  @"experienceId": [notif.userInfo objectForKey:@"experienceId"],
                                  @"deviceId": [EXKernel deviceInstallUUID],
                                  };
    [[EXKernel sharedInstance] dispatchKernelJSEvent:@"getExponentPushToken" body:eventParams onSuccess:success onFailure:failure];
  }
}

@end
