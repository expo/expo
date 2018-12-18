// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelServiceRegistry.h"
#import "EXBranchManager.h"
#import "EXCachedResourceManager.h"
#import "EXErrorRecoveryManager.h"
#import "EXFileSystemManager.h"
#import "EXGoogleAuthManager.h"
#import "EXHomeModuleManager.h"
#import "EXKernelAppRegistry.h"
#import "EXKernelLinkingManager.h"
#import "EXKernelService.h"
#import "EXRemoteNotificationManager.h"
#import "EXScreenOrientationManager.h"
#import "EXSensorManager.h"
#import "EXAudioSessionManager.h"
#import "EXUpdatesManager.h"
#import "EXUserNotificationManager.h"
#import "EXUserNotificationCenter.h"

#import <EXCore/EXModuleRegistryProvider.h>

@interface EXKernelServiceRegistry ()

@property (nonatomic, strong) EXBranchManager *branchManager;
@property (nonatomic, strong) EXCachedResourceManager *cachedResourceManager;
@property (nonatomic, strong) EXFileSystemManager *fileSystemManager;
@property (nonatomic, strong) EXGoogleAuthManager *googleAuthManager;
@property (nonatomic, strong) EXErrorRecoveryManager *errorRecoveryManager;
@property (nonatomic, strong) EXHomeModuleManager *homeModuleManager;
@property (nonatomic, strong) EXKernelLinkingManager *linkingManager;
@property (nonatomic, strong) EXRemoteNotificationManager *remoteNotificationManager;
@property (nonatomic, strong) EXScreenOrientationManager *screenOrientationManager;
@property (nonatomic, strong) EXSensorManager *sensorManager;
@property (nonatomic, strong) EXAudioSessionManager *audioSessionManager;
@property (nonatomic, strong) EXUpdatesManager *updatesManager;
@property (nonatomic, strong) EXUserNotificationManager *notificationsManager;
@property (nonatomic, strong) EXUserNotificationCenter *notificationCenter;
@property (nonatomic, strong) NSDictionary<NSString *, id> *allServices;

@end

@implementation EXKernelServiceRegistry

- (instancetype)init
{
  if (self = [super init]) {
    // TODO: init these in some clean way
    [self branchManager];
    [self cachedResourceManager];
    [self errorRecoveryManager];
    [self remoteNotificationManager];
    [self linkingManager];
    [self homeModuleManager];
    [self screenOrientationManager];
    [self googleAuthManager];
    [self sensorManager];
    [self fileSystemManager];
    [self audioSessionManager];
    [self updatesManager];
    [self notificationsManager];
    [self notificationCenter];
  }
  return self;
}

- (EXBranchManager *)branchManager
{
  if (!_branchManager) {
    _branchManager = [[EXBranchManager alloc] init];
  }
  return _branchManager;
}

- (EXCachedResourceManager *)cachedResourceManager
{
  if (!_cachedResourceManager) {
    _cachedResourceManager = [[EXCachedResourceManager alloc] init];
  }
  return _cachedResourceManager;
}

- (EXRemoteNotificationManager *)remoteNotificationManager
{
  if (!_remoteNotificationManager) {
    _remoteNotificationManager = [[EXRemoteNotificationManager alloc] initWithUserNotificationCenter:[self notificationCenter]];
  }
  return _remoteNotificationManager;
}

- (EXErrorRecoveryManager *)errorRecoveryManager
{
  if (!_errorRecoveryManager) {
    _errorRecoveryManager = [[EXErrorRecoveryManager alloc] init];
  }
  return _errorRecoveryManager;
}

- (EXFileSystemManager *)fileSystemManager
{
  if (!_fileSystemManager) {
    _fileSystemManager = [[EXFileSystemManager alloc] init];
  }
  return _fileSystemManager;
}

- (EXGoogleAuthManager *)googleAuthManager
{
  if (!_googleAuthManager) {
    _googleAuthManager = [[EXGoogleAuthManager alloc] init];
  }
  return _googleAuthManager;
}

- (EXKernelLinkingManager *)linkingManager
{
  if (!_linkingManager) {
    _linkingManager = [[EXKernelLinkingManager alloc] init];
  }
  return _linkingManager;
}

- (EXHomeModuleManager *)homeModuleManager
{
  if (!_homeModuleManager) {
    _homeModuleManager = [[EXHomeModuleManager alloc] init];
  }
  return _homeModuleManager;
}

- (EXScreenOrientationManager *)screenOrientationManager
{
  if (!_screenOrientationManager) {
    _screenOrientationManager = [[EXScreenOrientationManager alloc] init];
  }
  return _screenOrientationManager;
}

- (EXSensorManager *)sensorManager
{
  if (!_sensorManager) {
    _sensorManager = [[EXSensorManager alloc] init];
  }
  return _sensorManager;
}

- (EXAudioSessionManager *)audioSessionManager
{
  if (!_audioSessionManager) {
    _audioSessionManager = [[EXAudioSessionManager alloc] init];
  }
  return _audioSessionManager;
}

- (EXUpdatesManager *)updatesManager
{
  if (!_updatesManager) {
    _updatesManager = [[EXUpdatesManager alloc] init];
  }
  return _updatesManager;
}

- (EXUserNotificationManager *)notificationsManager
{
  if (!_notificationsManager) {
    _notificationsManager = [[EXUserNotificationManager alloc] init];
  }
  return _notificationsManager;
}

- (EXUserNotificationCenter *)notificationCenter
{
  if (!_notificationCenter) {
    _notificationCenter = [[EXUserNotificationCenter alloc] init];
  }
  return _notificationCenter;
}

- (NSDictionary *)allServices
{
  if (!_allServices) {
    NSMutableDictionary *result = [NSMutableDictionary dictionary];
    // Here we have services that must be accessible by our scoped Expo modules
    // EXVersionManagers pass these modules to scoped modules as an initializer argument
    //
    // New modules should access singleton modules via the module registry.
    // New singleton modules should register themselves in EXModuleRegistryProvider's set
    // using EX_REGISTER_SINGLETON_MODULE macro.
    NSArray *registryServices = @[
                                  self.branchManager,
                                  self.cachedResourceManager,
                                  self.errorRecoveryManager,
                                  self.fileSystemManager,
                                  self.googleAuthManager,
                                  self.homeModuleManager,
                                  self.linkingManager,
                                  self.remoteNotificationManager,
                                  self.screenOrientationManager,
                                  self.sensorManager,
                                  self.updatesManager,
                                  self.audioSessionManager,
                                  self.notificationsManager,
                                  self.notificationCenter
                                  ];
    NSArray *allServices = [registryServices arrayByAddingObjectsFromArray:[[EXModuleRegistryProvider singletonModules] allObjects]];
    for (id service in allServices) {
      NSString *className = NSStringFromClass([service class]);
      result[className] = service;
    }
    _allServices = result;
  }
  return _allServices;
}

#pragma mark - app registry delegate

- (void)appRegistry:(EXKernelAppRegistry *)registry didRegisterAppRecord:(EXKernelAppRecord *)appRecord
{
  [self.allServices enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull className, id  _Nonnull service, BOOL * _Nonnull stop) {
    if ([service respondsToSelector:@selector(kernelDidRegisterAppWithRecord:)]) {
      [service kernelDidRegisterAppWithRecord:appRecord];
    }
  }];
}

- (void)appRegistry:(EXKernelAppRegistry *)registry willUnregisterAppRecord:(EXKernelAppRecord *)appRecord
{
  [self.allServices enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull className, id  _Nonnull service, BOOL * _Nonnull stop) {
    if ([service respondsToSelector:@selector(kernelWillUnregisterAppWithRecord:)]) {
      [service kernelWillUnregisterAppWithRecord:appRecord];
    }
  }];
}

@end
