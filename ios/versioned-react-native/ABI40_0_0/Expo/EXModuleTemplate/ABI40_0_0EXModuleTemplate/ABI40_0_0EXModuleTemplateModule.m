// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXModuleTemplate/ABI40_0_0EXModuleTemplateModule.h>

@interface ABI40_0_0EXModuleTemplateModule ()

@property (nonatomic, weak) ABI40_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI40_0_0EXModuleTemplateModule

ABI40_0_0UM_EXPORT_MODULE(ExpoModuleTemplate);

- (void)setModuleRegistry:(ABI40_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI40_0_0UM_EXPORT_METHOD_AS(someGreatMethodAsync,
                    options:(NSDictionary *)options
                    resolve:(ABI40_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI40_0_0UMPromiseRejectBlock)reject)
{
}

@end
