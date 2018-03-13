// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXApiV2Client+EXRemoteNotifications.h"
#import "EXKernel.h"
#import "EXProvisioningProfile.h"
#import "EXRemoteNotificationManager.h"
#import "EXShellManager.h"
#import "NSData+EXRemoteNotifications.h"

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

@end

@implementation EXRemoteNotificationManager

- (instancetype)init
{
  if (self = [super init]) {
    // NOTE: We currently use the main queue because we use UIApplication to register for
    // notifications but with UNNotificationCenter we can use a custom serial queue
    _queue = dispatch_get_main_queue();
    _currentAPNSToken = nil;
    _apnsTokenHandlers = [NSMutableArray array];
    _isPostingCurrentToken = NO;
  }
  return self;
}

- (void)registerForRemoteNotifications
{
  if (![self _supportsCurrentRuntimeEnvironment]) {
    // don't register, because the detached app may not be built with APNS entitlements,
    // and in that case this method would actually be bad to call. (not just a no-op.)
    DDLogWarn(@"Expo Remote Notification services won't work in an ExpoKit app because Expo cannot manage your APNS certificates.");
  } else {
    [RCTSharedApplication() registerForRemoteNotifications];
  }
}

- (void)registerAPNSToken:(nullable NSData *)token registrationError:(nullable NSError *)error
{
  if (@available(iOS 10, *)) {
    dispatch_assert_queue(_queue);
  }
  
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

- (void)handleRemoteNotification:(nullable NSDictionary *)notification fromBackground:(BOOL)isFromBackground
{
  if (![self _supportsCurrentRuntimeEnvironment]) {
    DDLogWarn(@"Expo Remote Notification services won't work in an ExpoKit app because Expo cannot manage your APNS certificates.");
  }
  if (notification) {
    NSDictionary *body = notification[@"body"] ?: @{};
    NSString *experienceId = notification[@"experienceId"];
    if (experienceId) {
      [[EXKernel sharedInstance] sendNotification:body
                               toExperienceWithId:experienceId
                                   fromBackground:isFromBackground
                                         isRemote:YES];
    }
  }
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
    if (![self _canRegisterForRemoteNotifications]) {
      NSError *error = [NSError errorWithDomain:kEXRemoteNotificationErrorDomain
                                           code:EXRemoteNotificationErrorCodePermissionNotGranted
                                       userInfo:@{
                                                  NSLocalizedDescriptionKey: @"This app does not have permission to show notifications",
                                                  }];
      handler(nil, error);
      return;
    }
    
    if (_currentAPNSToken) {
      NSString *experienceId = ((EXScopedBridgeModule *)scopedModule).experienceId;
      [[EXApiV2Client sharedClient] getExpoPushTokenForExperience:experienceId
                                                      deviceToken:_currentAPNSToken
                                                completionHandler:handler];
      return;
    }
    
    // When we receive the APNS token, register it with our server and receive an Expo push token
    [_apnsTokenHandlers addObject:^(NSData * _Nullable apnsToken, NSError * _Nullable registrationError) {
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
  });
}

- (void)getExpoPushTokenForScopedModule:(id)scopedModule success:(void (^)(NSDictionary *))success failure:(void (^)(NSString *))failure
{
  [self getExpoPushTokenForScopedModule:scopedModule completionHandler:^(NSString * _Nullable pushToken, NSError * _Nullable error) {
    if (error) {
      failure(error.localizedDescription);
    } else {
      success(@{ @"exponentPushToken": pushToken });
    }
  }];
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
    dispatch_async(_queue, ^{
      if (error) {
        DDLogWarn(@"Failed to send the APNS token to the Expo server: %@", error);
      }
      
      if ([currentToken isEqualToData:_currentAPNSToken]) {
        _isPostingCurrentToken = NO;
        if (!error) {
          [NSUserDefaults.standardUserDefaults setObject:currentToken forKey:kEXCurrentAPNSTokenDefaultsKey];
        }
      }
    });
  }];
}

- (BOOL)_canRegisterForRemoteNotifications
{
  if (@available(iOS 10, *)) {
    dispatch_assert_queue(_queue);
  }
  
  // When the user has not granted permission to display any type of notification, iOS doesn't
  // invoke the delegate methods and registering for remote notifications will never complete
  //
  // TODO: Switch this to use UNNotificationSettings for iOS 10+. Note that UNNotificationCenter
  // is not thread-safe but can run off of the main thread (ex: a serial queue for notifications).
  if (@available(iOS 10, *)) {
    dispatch_assert_queue(dispatch_get_main_queue());
  }
  UIUserNotificationSettings * settings = RCTSharedApplication().currentUserNotificationSettings;
  return settings.types != UIUserNotificationTypeNone;
}

- (BOOL)_supportsCurrentRuntimeEnvironment
{
  if (![EXShellManager sharedInstance].isDetached) {
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
