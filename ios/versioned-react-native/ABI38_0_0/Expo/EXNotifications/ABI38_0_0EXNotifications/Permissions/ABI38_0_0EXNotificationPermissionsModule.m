// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXNotifications/ABI38_0_0EXNotificationPermissionsModule.h>

#import <ABI38_0_0UMPermissionsInterface/ABI38_0_0UMPermissionsInterface.h>
#import <ABI38_0_0UMPermissionsInterface/ABI38_0_0UMPermissionsMethodsDelegate.h>

#import <ABI38_0_0EXNotifications/ABI38_0_0EXRemoteNotificationPermissionRequester.h>
#import <ABI38_0_0EXNotifications/ABI38_0_0EXUserFacingNotificationsPermissionsRequester.h>

@interface ABI38_0_0EXNotificationPermissionsModule ()

@property (nonatomic, weak) id<ABI38_0_0UMPermissionsInterface> permissionsManager;
@property (nonatomic, strong) ABI38_0_0EXUserFacingNotificationsPermissionsRequester *requester;
@property (nonatomic, strong) ABI38_0_0EXRemoteNotificationPermissionRequester *legacyRemoteNotificationsRequester;

@end

@implementation ABI38_0_0EXNotificationPermissionsModule

ABI38_0_0UM_EXPORT_MODULE(ExpoNotificationPermissionsModule);

- (instancetype)init
{
  if (self = [super init]) {
    _requester = [[ABI38_0_0EXUserFacingNotificationsPermissionsRequester alloc] initWithMethodQueue:self.methodQueue];
  }
  return self;
}

# pragma mark - Exported methods

ABI38_0_0UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI38_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI38_0_0UMPromiseRejectBlock)reject)
{
  [ABI38_0_0UMPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI38_0_0EXUserFacingNotificationsPermissionsRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI38_0_0UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(NSDictionary *)requestedPermissions
                    requester:(ABI38_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI38_0_0UMPromiseRejectBlock)reject)
{
  [_requester requestPermissions:requestedPermissions withResolver:resolve rejecter:reject];
}

# pragma mark - ABI38_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI38_0_0UMModuleRegistry *)moduleRegistry {
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI38_0_0UMPermissionsInterface)];
  if (!_legacyRemoteNotificationsRequester) {
    // TODO: Remove once we deprecate and remove "notifications" permission type
    _legacyRemoteNotificationsRequester = [[ABI38_0_0EXRemoteNotificationPermissionRequester alloc] initWithUserNotificationPermissionRequester:_requester permissionPublisher:[moduleRegistry getSingletonModuleForName:@"RemoteNotificationPermissionPublisher"] withMethodQueue:self.methodQueue];
  }
  [ABI38_0_0UMPermissionsMethodsDelegate registerRequesters:@[_requester, _legacyRemoteNotificationsRequester]
                            withPermissionsManager:_permissionsManager];
}

@end
