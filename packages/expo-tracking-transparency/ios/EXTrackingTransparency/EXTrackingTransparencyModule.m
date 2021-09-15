// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXTrackingTransparency/EXTrackingTransparencyModule.h>
#import <EXTrackingTransparency/EXTrackingPermissionRequester.h>

#import <ExpoModulesCore/EXPermissionsInterface.h>
#import <ExpoModulesCore/EXPermissionsMethodsDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXTrackingTransparencyModule ()

@property (nonatomic, weak) id<EXPermissionsInterface> permissionsManager;

@end

@implementation EXTrackingTransparencyModule

EX_EXPORT_MODULE(ExpoTrackingTransparency);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(EXPermissionsInterface)];
  [EXPermissionsMethodsDelegate registerRequesters:@[[EXTrackingPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

EX_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[EXTrackingPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

EX_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(EXPromiseResolveBlock)resolve
                    rejecter:(EXPromiseRejectBlock)reject)
{
  [EXPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[EXTrackingPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

@end

NS_ASSUME_NONNULL_END
