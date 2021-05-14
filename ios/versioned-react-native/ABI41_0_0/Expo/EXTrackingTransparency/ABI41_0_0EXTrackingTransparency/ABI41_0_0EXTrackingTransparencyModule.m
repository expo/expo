// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXTrackingTransparency/ABI41_0_0EXTrackingTransparencyModule.h>
#import <ABI41_0_0EXTrackingTransparency/ABI41_0_0EXTrackingPermissionRequester.h>

#import <ABI41_0_0UMPermissionsInterface/ABI41_0_0UMPermissionsInterface.h>
#import <ABI41_0_0UMPermissionsInterface/ABI41_0_0UMPermissionsMethodsDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI41_0_0EXTrackingTransparencyModule ()

@property (nonatomic, weak) id<ABI41_0_0UMPermissionsInterface> permissionsManager;

@end

@implementation ABI41_0_0EXTrackingTransparencyModule

ABI41_0_0UM_EXPORT_MODULE(ExpoTrackingTransparency);

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI41_0_0UMPermissionsInterface)];
  [ABI41_0_0UMPermissionsMethodsDelegate registerRequesters:@[[ABI41_0_0EXTrackingPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

ABI41_0_0UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  [ABI41_0_0UMPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI41_0_0EXTrackingPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI41_0_0UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI41_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI41_0_0UMPromiseRejectBlock)reject)
{
  [ABI41_0_0UMPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI41_0_0EXTrackingPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

@end

NS_ASSUME_NONNULL_END
