// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXKernelServiceRegistry.h"
#import "EXBranchManager.h"
#import "EXErrorRecoveryManager.h"
#import "EXGoogleAuthManager.h"
#import "EXKernelLinkingManager.h"
#import "EXKernelModuleManager.h"
#import "EXKernelService.h"
#import "EXRemoteNotificationManager.h"
#import "EXScreenOrientationManager.h"
#import "EXSensorManager.h"

@interface EXKernelServiceRegistry ()

@property (nonatomic, strong) EXBranchManager *branchManager;
@property (nonatomic, strong) EXGoogleAuthManager *googleAuthManager;
@property (nonatomic, strong) EXErrorRecoveryManager *errorRecoveryManager;
@property (nonatomic, strong) EXKernelModuleManager *kernelModuleManager;
@property (nonatomic, strong) EXKernelLinkingManager *linkingManager;
@property (nonatomic, strong) EXRemoteNotificationManager *remoteNotificationManager;
@property (nonatomic, strong) EXScreenOrientationManager *screenOrientationManager;
@property (nonatomic, strong) EXSensorManager *sensorManager;
@property (nonatomic, strong) NSDictionary<NSString *, id> *allServices;

@end

@implementation EXKernelServiceRegistry

- (instancetype)init
{
  if (self = [super init]) {
    // TODO: init these in some clean way
    [self branchManager];
    [self errorRecoveryManager];
    [self remoteNotificationManager];
    [self linkingManager];
    [self kernelModuleManager];
    [self screenOrientationManager];
    [self googleAuthManager];
    [self sensorManager];
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

- (EXRemoteNotificationManager *)remoteNotificationManager
{
  if (!_remoteNotificationManager) {
    _remoteNotificationManager = [[EXRemoteNotificationManager alloc] init];
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

- (EXKernelModuleManager *)kernelModuleManager
{
  if (!_kernelModuleManager) {
    _kernelModuleManager = [[EXKernelModuleManager alloc] init];
  }
  return _kernelModuleManager;
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

- (NSDictionary *)allServices
{
  if (!_allServices) {
    NSMutableDictionary *result = [NSMutableDictionary dictionary];
    for (id service in @[ self.branchManager, self.errorRecoveryManager, self.googleAuthManager, self.kernelModuleManager, self.linkingManager, self.remoteNotificationManager, self.screenOrientationManager, self.sensorManager ]) {
      NSString *className = NSStringFromClass([service class]);
      result[className] = service;
    }
    _allServices = result;
  }
  return _allServices;
}

#pragma mark - bridge registry delegate

- (void)bridgeRegistry:(EXKernelBridgeRegistry *)registry didRegisterBridgeRecord:(EXKernelBridgeRecord *)bridgeRecord
{
  [self.allServices enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull className, id  _Nonnull service, BOOL * _Nonnull stop) {
    if ([service respondsToSelector:@selector(kernelDidRegisterBridgeWithRecord:)]) {
      [service kernelDidRegisterBridgeWithRecord:bridgeRecord];
    }
  }];
}

- (void)bridgeRegistry:(EXKernelBridgeRegistry *)registry willUnregisterBridgeRecord:(EXKernelBridgeRecord *)bridgeRecord
{
  [self.allServices enumerateKeysAndObjectsUsingBlock:^(NSString * _Nonnull className, id  _Nonnull service, BOOL * _Nonnull stop) {
    if ([service respondsToSelector:@selector(kernelWillUnregisterBridgeWithRecord:)]) {
      [service kernelWillUnregisterBridgeWithRecord:bridgeRecord];
    }
  }];
}

@end
