// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXApiV2Client+EXRemoteNotifications.h"
#import "EXEnvironment.h"
#import "EXKernel.h"
#import "EXProvisioningProfile.h"
#import "EXRemoteNotificationManager.h"
#import "NSData+EXRemoteNotifications.h"
#import "EXUserNotificationCenter.h"

#import <React/RCTUtils.h>

NS_ASSUME_NONNULL_BEGIN

NSString * const kEXRemoteNotificationErrorDomain = @"remote-notifications";
typedef NS_ENUM(NSInteger, EXRemoteNotificationErrorCode) {
  EXRemoteNotificationErrorCodePermissionNotGranted,
  EXRemoteNotificationErrorCodeAPNSRegistrationFailed,
};

// NSUserDefaults key of the most recent APNS device token that was successfully posted
NSString * const kEXCurrentAPNSTokenDefaultsKey = @"EXCurrentAPNSTokenDefaultsKey";

typedef void(^EXRemoteNotificationAPNSTokenHandler)(NSData * _Nullable apnsToken,
                                                    NSError * _Nullable registrationError);

@interface EXRemoteNotificationManager ()

@property (nonatomic, strong) dispatch_queue_t queue;
@property (nullable, nonatomic, strong) NSData *currentAPNSToken;
@property (nonatomic, strong) NSMutableArray<EXRemoteNotificationAPNSTokenHandler> *apnsTokenHandlers;
@property (nonatomic, assign) BOOL isPostingCurrentToken;
@property (nonatomic, weak) EXUserNotificationCenter *userNotificationCenter;

@end

@implementation EXRemoteNotificationManager

- (instancetype)initWithUserNotificationCenter:(id)userNotificationCenter
{
  if (self = [super init]) {
    // NOTE: We currently use the main queue because we use UIApplication to register for
    // notifications but with UNNotificationCenter we can use a custom serial queue
    _queue = dispatch_get_main_queue();
    _currentAPNSToken = nil;
    _apnsTokenHandlers = [NSMutableArray array];
    _isPostingCurrentToken = NO;
    _userNotificationCenter = userNotificationCenter;
  }
  return self;
}

- (void)registerForRemoteNotifications
{
  if (![self supportsCurrentRuntimeEnvironment]) {
    // don't register, because the detached app may not be built with APNS entitlements,
    // and in that case this method would actually be bad to call. (not just a no-op.)
    DDLogWarn(@"Expo Remote Notification services won't work in an ExpoKit app because Expo cannot manage your APNS certificates.");
    
    // when the app is eligible to register for remote notifications,
    // we eventually call [self registerAPNSToken] and fulfill the pending promises,
    // but in this code path we never register for notifications so we need to reject the pending promises manually
    [self rejectPendingAPNSTokenHandlers];
  } else {
    dispatch_async(dispatch_get_main_queue(), ^{
      [RCTSharedApplication() registerForRemoteNotifications];
    });
  }
}

- (void)rejectPendingAPNSTokenHandlers
{
  dispatch_assert_queue(_queue);
  
  NSArray<EXRemoteNotificationAPNSTokenHandler> *apnsTokenHandlers = [_apnsTokenHandlers copy];
  [_apnsTokenHandlers removeAllObjects];
  [apnsTokenHandlers enumerateObjectsUsingBlock:^(EXRemoteNotificationAPNSTokenHandler handler,
                                                  NSUInteger idx,
                                                  BOOL *stop) {
    NSError *error = [NSError errorWithDomain:kEXRemoteNotificationErrorDomain
                                         code:EXRemoteNotificationErrorCodeAPNSRegistrationFailed
                                     userInfo:@{
                                                NSLocalizedDescriptionKey: @"The device was unable to register for remote notifications with Apple, because Expo cannot manage your APNS certificates"
                                                }];
    handler(nil, error);
  }];
}

- (void)registerAPNSToken:(nullable NSData *)token registrationError:(nullable NSError *)error
{
  dispatch_assert_queue(_queue);

  BOOL tokenDidChange = (token != _currentAPNSToken) && ![token isEqualToData:_currentAPNSToken];
  if (tokenDidChange) {
    _currentAPNSToken = token;
    _isPostingCurrentToken = NO;
  }

  // Invoke the blocks waiting for the new APNS token
  NSArray<EXRemoteNotificationAPNSTokenHandler> *apnsTokenHandlers = [_apnsTokenHandlers copy];
  [_apnsTokenHandlers removeAllObjects];
  [apnsTokenHandlers enumerateObjectsUsingBlock:^(EXRemoteNotificationAPNSTokenHandler handler,
                                                  NSUInteger idx,
                                                  BOOL *stop) {
    handler(token, error);
  }];

  [self _synchronizeCurrentAPNSToken:token];
}

#pragma mark - scoped module delegate

- (NSString *)apnsTokenStringForScopedModule:(__unused id)scopedModule
{
  NSData *maybeToken = _currentAPNSToken ?: [NSUserDefaults.standardUserDefaults objectForKey:kEXCurrentAPNSTokenDefaultsKey];
  if (maybeToken) {
    return [maybeToken apnsTokenString];
  }
  return nil;
}

- (void)getExpoPushTokenForScopedModule:(id)scopedModule
                      completionHandler:(void (^)(NSString * _Nullable, NSError * _Nullable))handler
{
  __weak id weakScopedModule = scopedModule;
  dispatch_async(_queue, ^{
    [self _canRegisterForRemoteNotificationsWithCompletionHandler:^(BOOL can) {
      if (!can) {
        NSError *error = [NSError errorWithDomain:kEXRemoteNotificationErrorDomain
                                             code:EXRemoteNotificationErrorCodePermissionNotGranted
                                         userInfo:@{
                                                    NSLocalizedDescriptionKey: @"This app does not have permission to show notifications",
                                                    }];
        handler(nil, error);
        return;
      }

      if (self->_currentAPNSToken) {
        NSString *experienceId = ((EXScopedBridgeModule *)scopedModule).experienceId;
        [[EXApiV2Client sharedClient] getExpoPushTokenForExperience:experienceId
                                                        deviceToken:self->_currentAPNSToken
                                                  completionHandler:handler];
        return;
      }

      // When we receive the APNS token, register it with our server and receive an Expo push token
      [self->_apnsTokenHandlers addObject:^(NSData * _Nullable apnsToken, NSError * _Nullable registrationError) {
        __strong id strongScopedModule = weakScopedModule;
        if (!strongScopedModule) {
          NSError *error = [NSError errorWithDomain:kEXKernelErrorDomain
                                               code:EXKernelErrorCodeModuleDeallocated
                                           userInfo:@{
                                                      NSLocalizedDescriptionKey: @"The scoped module that requested an Expo push token was deallocated",
                                                      }];
          handler(nil, error);
          return;
        }

        if (apnsToken) {
          NSString *experienceId = ((EXScopedBridgeModule *)scopedModule).experienceId;
          [[EXApiV2Client sharedClient] getExpoPushTokenForExperience:experienceId
                                                          deviceToken:apnsToken
                                                    completionHandler:handler];
        } else {
          NSError *error = [NSError errorWithDomain:kEXRemoteNotificationErrorDomain
                                               code:EXRemoteNotificationErrorCodeAPNSRegistrationFailed
                                           userInfo:@{
                                                      NSLocalizedDescriptionKey: @"The device was unable to register for remote notifications with Apple",
                                                      NSUnderlyingErrorKey: registrationError,
                                                      }];
          handler(nil, error);
        }
      }];

      [self registerForRemoteNotifications];
    }];
  });
}

#pragma mark - Internal

- (void)_synchronizeCurrentAPNSToken:(NSData *)currentToken
{
  if (!currentToken) {
    [NSUserDefaults.standardUserDefaults removeObjectForKey:kEXCurrentAPNSTokenDefaultsKey];
    return;
  }

  NSData *postedToken = [NSUserDefaults.standardUserDefaults objectForKey:kEXCurrentAPNSTokenDefaultsKey];
  if ([currentToken isEqualToData:postedToken] || _isPostingCurrentToken) {
    return;
  }

  _isPostingCurrentToken = YES;
  [[EXApiV2Client sharedClient] updateDeviceToken:currentToken completionHandler:^(NSError * _Nullable error) {
    dispatch_async(self->_queue, ^{
      if (error) {
        DDLogWarn(@"Failed to send the APNS token to the Expo server: %@", error);
      }

      if ([currentToken isEqualToData:self->_currentAPNSToken]) {
        self->_isPostingCurrentToken = NO;
        if (!error) {
          [NSUserDefaults.standardUserDefaults setObject:currentToken forKey:kEXCurrentAPNSTokenDefaultsKey];
        }
      }
    });
  }];
}

- (void)_canRegisterForRemoteNotificationsWithCompletionHandler:(void (^)(BOOL can))handler
{
  dispatch_assert_queue(_queue);

  // When the user has not granted permission to display any type of notification, iOS doesn't
  // invoke the delegate methods and registering for remote notifications will never complete
  [_userNotificationCenter getNotificationSettingsWithCompletionHandler:^(UNNotificationSettings * _Nonnull settings) {
    bool canRegister = settings.authorizationStatus == UNAuthorizationStatusAuthorized;
    if (@available(iOS 12, *)) {
      canRegister |= (settings.authorizationStatus == UNAuthorizationStatusProvisional);
    }
    handler(canRegister);
  }];
}

- (BOOL)supportsCurrentRuntimeEnvironment
{
  if (![EXEnvironment sharedEnvironment].isDetached) {
    return YES;
  }

#ifdef EX_DETACHED_SERVICE
  BOOL isBuiltByService = YES;
#else
  BOOL isBuiltByService = NO;
#endif
  return isBuiltByService;
}

@end

NS_ASSUME_NONNULL_END
