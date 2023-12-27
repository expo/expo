// Copyright 2021-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXTrackingTransparency/ABI44_0_0EXTrackingTransparencyModule.h>
#import <ABI44_0_0EXTrackingTransparency/ABI44_0_0EXTrackingPermissionRequester.h>

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXPermissionsInterface.h>
#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXPermissionsMethodsDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI44_0_0EXTrackingTransparencyModule ()

@property (nonatomic, weak) id<ABI44_0_0EXPermissionsInterface> permissionsManager;

@end

@implementation ABI44_0_0EXTrackingTransparencyModule

ABI44_0_0EX_EXPORT_MODULE(ExpoTrackingTransparency);

- (void)setModuleRegistry:(ABI44_0_0EXModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(ABI44_0_0EXPermissionsInterface)];
  [ABI44_0_0EXPermissionsMethodsDelegate registerRequesters:@[[ABI44_0_0EXTrackingPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

ABI44_0_0EX_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  [ABI44_0_0EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[ABI44_0_0EXTrackingPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

ABI44_0_0EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(ABI44_0_0EXPromiseResolveBlock)resolve
                    rejecter:(ABI44_0_0EXPromiseRejectBlock)reject)
{
  [ABI44_0_0EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[ABI44_0_0EXTrackingPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

@end

NS_ASSUME_NONNULL_END
