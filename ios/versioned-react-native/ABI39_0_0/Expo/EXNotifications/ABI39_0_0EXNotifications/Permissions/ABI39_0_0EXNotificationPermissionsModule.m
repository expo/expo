// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0EXNotifications/ABI39_0_0EXNotificationPermissionsModule.h>

#import <ABI39_0_0UMPermissionsInterface/ABI39_0_0UMPermissionsInterface.h>
#import <ABI39_0_0UMPermissionsInterface/ABI39_0_0UMPermissionsMethodsDelegate.h>

#import <ABI39_0_0EXNotifications/ABI39_0_0EXLegacyRemoteNotificationPermissionRequester.h>
#import <ABI39_0_0EXNotifications/ABI39_0_0EXUserFacingNotificationsPermissionsRequester.h>

@interface ABI39_0_0EXNotificationPermissionsModule ()

@property (nonatomic, weak) id<ABI39_0_0UMPermissionsInterface> permissionsManager;
@property (nonatomic, strong) ABI39_0_0EXUserFacingNotificationsPermissionsRequester *requester;
@property (nonatomic, strong) ABI39_0_0EXLegacyRemoteNotificationPermissionRequester *legacyRemoteNotificationsRequester;

@end

@implementation ABI39_0_0EXNotificationPermissionsModule

ABI39_0_0UM_EXPORT_MODULE(ExpoNotificationPermissionsModule);

- (instancetype)init
{
  if (self = [super init]) {
    _requester = [[ABI39_0_0EXUserFacingNotificationsPermissionsRequester alloc] initWithMethodQueue:self.methodQueue];
  }
  return self;
}

# pragma mark - Exported methods

ABI39_0_0UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI39_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI39_0_0UMPromiseRejectBlock)reject)
{
  [ABI39_0_0UMPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI39_0_0EXUserFacingNotificationsPermissionsRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI39_0_0UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(NSDictionary *)requestedPermissions
                    requester:(ABI39_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI39_0_0UMPromiseRejectBlock)reject)
{
  [_requester requestPermissions:requestedPermissions withResolver:resolve rejecter:reject];
}

# pragma mark - ABI39_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI39_0_0UMModuleRegistry *)moduleRegistry {
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI39_0_0UMPermissionsInterface)];
  if (!_legacyRemoteNotificationsRequester) {
    // TODO: Remove once we deprecate and remove "notifications" permission type
    _legacyRemoteNotificationsRequester = [[ABI39_0_0EXLegacyRemoteNotificationPermissionRequester alloc] initWithUserNotificationPermissionRequester:_requester permissionPublisher:[moduleRegistry getSingletonModuleForName:@"RemoteNotificationPermissionPublisher"] withMethodQueue:self.methodQueue];
  }
  [ABI39_0_0UMPermissionsMethodsDelegate registerRequesters:@[_requester, _legacyRemoteNotificationsRequester]
                            withPermissionsManager:_permissionsManager];
}

@end
