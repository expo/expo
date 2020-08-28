// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI39_0_0EXModuleTemplate/ABI39_0_0EXModuleTemplateModule.h>

@interface ABI39_0_0EXModuleTemplateModule ()

@property (nonatomic, weak) ABI39_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI39_0_0EXModuleTemplateModule

ABI39_0_0UM_EXPORT_MODULE(ExpoModuleTemplate);

- (void)setModuleRegistry:(ABI39_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI39_0_0UM_EXPORT_METHOD_AS(someGreatMethodAsync,
                    options:(NSDictionary *)options
                    resolve:(ABI39_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI39_0_0UMPromiseRejectBlock)reject)
{
}

@end
