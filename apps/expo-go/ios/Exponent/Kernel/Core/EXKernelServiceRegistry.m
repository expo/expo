// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelServiceRegistry.h"
#import "EXErrorRecoveryManager.h"
#import "EXKernelAppRegistry.h"
#import "EXKernelLinkingManager.h"
#import "EXSensorManager.h"
#import "EXUpdatesDatabaseManager.h"
#import "EXUpdatesManager.h"

#import <ExpoModulesCore/EXModuleRegistryProvider.h>

@interface EXKernelServiceRegistry ()

@property (nonatomic, strong) EXErrorRecoveryManager *errorRecoveryManager;
@property (nonatomic, strong) EXKernelLinkingManager *linkingManager;
@property (nonatomic, strong) EXSensorManager *sensorManager;
@property (nonatomic, strong) EXUpdatesDatabaseManager *updatesDatabaseManager;
@property (nonatomic, strong) EXUpdatesManager *updatesManager;
@property (nonatomic, strong) NSDictionary<NSString *, id> *allServices;

@end

@implementation EXKernelServiceRegistry

- (instancetype)init
{
  if (self = [super init]) {
    // TODO: init these in some clean way
    [self errorRecoveryManager];
    [self linkingManager];
    [self sensorManager];
    [self updatesDatabaseManager];
    [self updatesManager];
  }
  return self;
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
                                  self.errorRecoveryManager,
                                  self.linkingManager,
                                  self.sensorManager,
                                  self.updatesDatabaseManager,
                                  self.updatesManager
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
