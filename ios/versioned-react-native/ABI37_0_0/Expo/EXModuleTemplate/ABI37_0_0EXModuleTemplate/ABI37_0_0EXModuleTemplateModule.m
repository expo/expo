// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXModuleTemplate/ABI37_0_0EXModuleTemplateModule.h>

@interface ABI37_0_0EXModuleTemplateModule ()

@property (nonatomic, weak) ABI37_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI37_0_0EXModuleTemplateModule

ABI37_0_0UM_EXPORT_MODULE(ExpoModuleTemplate);

- (void)setModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI37_0_0UM_EXPORT_METHOD_AS(someGreatMethodAsync,
                    options:(NSDictionary *)options
                    resolve:(ABI37_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI37_0_0UMPromiseRejectBlock)reject)
{
}

@end
