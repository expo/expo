// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXPreventScreenshot/EXPreventScreenshotModule.h>

@interface EXPreventScreenshotModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXPreventScreenshotModule

UM_EXPORT_MODULE(ExpoPreventScreenshot);

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
