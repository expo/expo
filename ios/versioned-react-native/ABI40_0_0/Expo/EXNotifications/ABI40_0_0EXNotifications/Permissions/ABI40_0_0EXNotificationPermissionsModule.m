// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXNotifications/ABI40_0_0EXNotificationPermissionsModule.h>

#import <ABI40_0_0UMPermissionsInterface/ABI40_0_0UMPermissionsInterface.h>
#import <ABI40_0_0UMPermissionsInterface/ABI40_0_0UMPermissionsMethodsDelegate.h>

#import <ABI40_0_0EXNotifications/ABI40_0_0EXLegacyRemoteNotificationPermissionRequester.h>
#import <ABI40_0_0EXNotifications/ABI40_0_0EXUserFacingNotificationsPermissionsRequester.h>

@interface ABI40_0_0EXNotificationPermissionsModule ()

@property (nonatomic, weak) id<ABI40_0_0UMPermissionsInterface> permissionsManager;
@property (nonatomic, strong) ABI40_0_0EXUserFacingNotificationsPermissionsRequester *requester;
@property (nonatomic, strong) ABI40_0_0EXLegacyRemoteNotificationPermissionRequester *legacyRemoteNotificationsRequester;

@end

@implementation ABI40_0_0EXNotificationPermissionsModule

ABI40_0_0UM_EXPORT_MODULE(ExpoNotificationPermissionsModule);

- (instancetype)init
{
  if (self = [super init]) {
    _requester = [[ABI40_0_0EXUserFacingNotificationsPermissionsRequester alloc] initWithMethodQueue:self.methodQueue];
  }
  return self;
}

# pragma mark - Exported methods

ABI40_0_0UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI40_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  [ABI40_0_0UMPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI40_0_0EXUserFacingNotificationsPermissionsRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI40_0_0UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(NSDictionary *)requestedPermissions
                    requester:(ABI40_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI40_0_0UMPromiseRejectBlock)reject)
{
  [ABI40_0_0UMPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI40_0_0EXUserFacingNotificationsPermissionsRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

# pragma mark - ABI40_0_0UMModuleRegistryConsumer

- (void)setModuleRegistry:(ABI40_0_0UMModuleRegistry *)moduleRegistry {
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI40_0_0UMPermissionsInterface)];
  if (!_legacyRemoteNotificationsRequester) {
    // TODO: Remove once we deprecate and remove "notifications" permission type
    _legacyRemoteNotificationsRequester = [[ABI40_0_0EXLegacyRemoteNotificationPermissionRequester alloc] initWithUserNotificationPermissionRequester:_requester permissionPublisher:[moduleRegistry getSingletonModuleForName:@"RemoteNotificationPermissionPublisher"] withMethodQueue:self.methodQueue];
  }
  [ABI40_0_0UMPermissionsMethodsDelegate registerRequesters:@[_requester, _legacyRemoteNotificationsRequester]
                            withPermissionsManager:_permissionsManager];
}

@end
