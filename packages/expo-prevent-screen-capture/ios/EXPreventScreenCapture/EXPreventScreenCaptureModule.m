// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXPreventScreenCapture/EXPreventScreenCaptureModule.h>

@interface EXPreventScreenCaptureModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXPreventScreenCaptureModule

UM_EXPORT_MODULE(ExpoPreventScreenCapture);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

UM_EXPORT_METHOD_AS(activatePreventScreenCapture,
                    activatePreventScreenCaptureWithResolver:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
    resolve(NULL);
}

UM_EXPORT_METHOD_AS(deactivatePreventScreenCapture,
                    deactivatePreventScreenCaptureWithResolver:(UMPromiseResolveBlock)resolve
                    rejecter:(UMPromiseRejectBlock)reject)
{
    resolve(NULL);
}

@end
