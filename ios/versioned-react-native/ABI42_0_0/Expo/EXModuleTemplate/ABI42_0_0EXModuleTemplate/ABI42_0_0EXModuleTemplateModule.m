// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXModuleTemplate/ABI42_0_0EXModuleTemplateModule.h>

@interface ABI42_0_0EXModuleTemplateModule ()

@property (nonatomic, weak) ABI42_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI42_0_0EXModuleTemplateModule

ABI42_0_0UM_EXPORT_MODULE(ExpoModuleTemplate);

- (void)setModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI42_0_0UM_EXPORT_METHOD_AS(someGreatMethodAsync,
                    options:(NSDictionary *)options
                    resolve:(ABI42_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI42_0_0UMPromiseRejectBlock)reject)
{
}

@end
