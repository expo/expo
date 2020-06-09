// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMTestCore/UMTestCoreModule.h>

@interface UMTestCoreModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation UMTestCoreModule

UM_EXPORT_MODULE(UnimodulesTestCore);

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
