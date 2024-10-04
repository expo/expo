// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelServiceRegistry.h"
#import "EXCachedResourceManager.h"
#import "EXErrorRecoveryManager.h"
#import "EXHomeModuleManager.h"
#import "EXKernelAppRegistry.h"
#import "EXKernelLinkingManager.h"
#import "EXSensorManager.h"
#import "EXUpdatesDatabaseManager.h"
#import "EXUpdatesManager.h"
#import "EXDeviceInstallationUUIDService.h"

#import <ExpoModulesCore/EXModuleRegistryProvider.h>

@interface EXKernelServiceRegistry ()

@property (nonatomic, strong) EXCachedResourceManager *cachedResourceManager;
@property (nonatomic, strong) EXErrorRecoveryManager *errorRecoveryManager;
@property (nonatomic, strong) EXHomeModuleManager *homeModuleManager;
@property (nonatomic, strong) EXKernelLinkingManager *linkingManager;
@property (nonatomic, strong) EXSensorManager *sensorManager;
@property (nonatomic, strong) EXUpdatesDatabaseManager *updatesDatabaseManager;
@property (nonatomic, strong) EXUpdatesManager *updatesManager;
@property (nonatomic, strong) EXDeviceInstallationUUIDService *deviceInstallationUUIDService;
@property (nonatomic, strong) NSDictionary<NSString *, id> *allServices;

@end

@implementation EXKernelServiceRegistry

- (instancetype)init
{
  if (self = [super init]) {
    // TODO: init these in some clean way
    [self cachedResourceManager];
    [self errorRecoveryManager];
    [self linkingManager];
    [self homeModuleManager];
    [self sensorManager];
    [self updatesDatabaseManager];
    [self updatesManager];
    [self deviceInstallationUUIDService];
  }
  return self;
}

- (EXDeviceInstallationUUIDService *)deviceInstallationUUIDService
{
  if (!_deviceInstallationUUIDService) {
    _deviceInstallationUUIDService = [[EXDeviceInstallationUUIDService alloc] init];
  }
  return _deviceInstallationUUIDService;
}

- (EXCachedResourceManager *)cachedResourceManager
{
  if (!_cachedResourceManager) {
    _cachedResourceManager = [[EXCachedResourceManager alloc] init];
  }
  return _cachedResourceManager;
}

- (EXErrorRecoveryManager *)errorRecoveryManager
{
  if (!_errorRecoveryManager) {
    _errorRecoveryManager = [[EXErrorRecoveryManager alloc] init];
  }
  return _errorRecoveryManager;
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

- (EXSensorManager *)sensorManager
{
  if (!_sensorManager) {
    _sensorManager = [[EXSensorManager alloc] init];
  }
  return _sensorManager;
}

- (EXUpdatesDatabaseManager *)updatesDatabaseManager
{
  if (!_updatesDatabaseManager) {
    _updatesDatabaseManager = [[EXUpdatesDatabaseManager alloc] init];
  }
  return _updatesDatabaseManager;
}

- (EXUpdatesManager *)updatesManager
{
  if (!_updatesManager) {
    _updatesManager = [[EXUpdatesManager alloc] init];
  }
  return _updatesManager;
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
                                  self.cachedResourceManager,
                                  self.errorRecoveryManager,
                                  self.homeModuleManager,
                                  self.linkingManager,
                                  self.sensorManager,
                                  self.updatesDatabaseManager,
                                  self.updatesManager,
                                  self.deviceInstallationUUIDService
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

@end
