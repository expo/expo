// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXTrackingTransparency/ABI45_0_0EXTrackingTransparencyModule.h>
#import <ABI45_0_0EXTrackingTransparency/ABI45_0_0EXTrackingPermissionRequester.h>

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXPermissionsInterface.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXPermissionsMethodsDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI45_0_0EXTrackingTransparencyModule ()

@property (nonatomic, weak) id<ABI45_0_0EXPermissionsInterface> permissionsManager;

@end

@implementation ABI45_0_0EXTrackingTransparencyModule

ABI45_0_0EX_EXPORT_MODULE(ExpoTrackingTransparency);

- (void)setModuleRegistry:(ABI45_0_0EXModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI45_0_0EXPermissionsInterface)];
  [ABI45_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI45_0_0EXTrackingPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

ABI45_0_0EX_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  [ABI45_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI45_0_0EXTrackingPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI45_0_0EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI45_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI45_0_0EXPromiseRejectBlock)reject)
{
  [ABI45_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI45_0_0EXTrackingPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

@end

NS_ASSUME_NONNULL_END
