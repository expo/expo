// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXTrackingTransparency/ABI42_0_0EXTrackingTransparencyModule.h>
#import <ABI42_0_0EXTrackingTransparency/ABI42_0_0EXTrackingPermissionRequester.h>

#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXPermissionsInterface.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXPermissionsMethodsDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI42_0_0EXTrackingTransparencyModule ()

@property (nonatomic, weak) id<ABI42_0_0EXPermissionsInterface> permissionsManager;

@end

@implementation ABI42_0_0EXTrackingTransparencyModule

ABI42_0_0UM_EXPORT_MODULE(ExpoTrackingTransparency);

- (void)setModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXPermissionsInterface)];
  [ABI42_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI42_0_0EXTrackingPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

ABI42_0_0UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  [ABI42_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI42_0_0EXTrackingPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI42_0_0UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI42_0_0UMPromiseResolveBlock)resolve
                    rejecter:(ABI42_0_0UMPromiseRejectBlock)reject)
{
  [ABI42_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI42_0_0EXTrackingPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

@end

NS_ASSUME_NONNULL_END
