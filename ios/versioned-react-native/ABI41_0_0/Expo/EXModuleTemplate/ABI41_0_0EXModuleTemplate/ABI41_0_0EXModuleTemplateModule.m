// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0EXModuleTemplate/ABI41_0_0EXModuleTemplateModule.h>

@interface ABI41_0_0EXModuleTemplateModule ()

@property (nonatomic, weak) ABI41_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI41_0_0EXModuleTemplateModule

ABI41_0_0UM_EXPORT_MODULE(ExpoModuleTemplate);

- (void)setModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI41_0_0UM_EXPORT_METHOD_AS(someGreatMethodAsync,
                    options:(NSDictionary *)options
                    resolve:(ABI41_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI41_0_0UMPromiseRejectBlock)reject)
{
}

@end
