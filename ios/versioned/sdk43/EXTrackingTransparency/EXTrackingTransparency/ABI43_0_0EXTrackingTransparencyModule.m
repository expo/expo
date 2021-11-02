// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXTrackingTransparency/ABI43_0_0EXTrackingTransparencyModule.h>
#import <ABI43_0_0EXTrackingTransparency/ABI43_0_0EXTrackingPermissionRequester.h>

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXPermissionsInterface.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXPermissionsMethodsDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0EXTrackingTransparencyModule ()

@property (nonatomic, weak) id<ABI43_0_0EXPermissionsInterface> permissionsManager;

@end

@implementation ABI43_0_0EXTrackingTransparencyModule

ABI43_0_0EX_EXPORT_MODULE(ExpoTrackingTransparency);

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI43_0_0EXPermissionsInterface)];
  [ABI43_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI43_0_0EXTrackingPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

ABI43_0_0EX_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI43_0_0EXTrackingPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI43_0_0EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI43_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI43_0_0EXPromiseRejectBlock)reject)
{
  [ABI43_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI43_0_0EXTrackingPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

@end

NS_ASSUME_NONNULL_END
