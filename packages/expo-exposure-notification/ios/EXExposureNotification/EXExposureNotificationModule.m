// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXExposureNotification/EXExposureNotificationModule.h>

@interface EXExposureNotificationModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXExposureNotificationModule

UM_EXPORT_MODULE(ExpoExposureNotification);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

UM_EXPORT_METHOD_AS(someGreatMethodAsync,
                    options:(NSDictionary *)options
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
}

@end
