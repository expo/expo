// Copyright 2021-present 650 Industries. All rights reserved.

#import <EXTrackingTransparency/EXTrackingTransparencyModule.h>
#import <EXTrackingTransparency/EXTrackingPermissionRequester.h>

#import <UMPermissionsInterface/UMPermissionsInterface.h>
#import <UMPermissionsInterface/UMPermissionsMethodsDelegate.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXTrackingTransparencyModule ()

@property (nonatomic, weak) id<UMPermissionsInterface> permissionsManager;

@end

@implementation EXTrackingTransparencyModule

UM_EXPORT_MODULE(ExpoTrackingTransparency);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _permissionsManager = [moduleRegistry getModuleImplementingProtocol:@protocol(UMPermissionsInterface)];
  [UMPermissionsMethodsDelegate registerRequesters:@[[EXTrackingPermissionRequester new]] withPermissionsManager:_permissionsManager];
}

UM_EXPORT_METHOD_AS(getPermissionsAsync,
                    getPermissionsAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [UMPermissionsMethodsDelegate getPermissionWithPermissionsManager:_permissionsManager
                                                      withRequester:[EXTrackingPermissionRequester class]
                                                            resolve:resolve
                                                             reject:reject];
}

UM_EXPORT_METHOD_AS(requestPermissionsAsync,
                    requestPermissionsAsync:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
  [UMPermissionsMethodsDelegate askForPermissionWithPermissionsManager:_permissionsManager
                                                         withRequester:[EXTrackingPermissionRequester class]
                                                               resolve:resolve
                                                                reject:reject];
}

@end

NS_ASSUME_NONNULL_END
