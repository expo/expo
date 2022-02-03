// Copyright 2018-present 650 Industries. All rights reserved.

#import <UMTestCore/UMTestCoreModule.h>

@interface UMTestCoreModule ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation UMTestCoreModule

EX_EXPORT_MODULE(UnimodulesTestCore);

- (void)setModuleRegistry:(EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

EX_EXPORT_METHOD_AS(someGreatMethodAsync,
                    options:(NSDictionary *)options
                    resolve:(EXPromiseResolveBlock)resolve
                    reject:(EXPromiseRejectBlock)reject)
{
}

@end
