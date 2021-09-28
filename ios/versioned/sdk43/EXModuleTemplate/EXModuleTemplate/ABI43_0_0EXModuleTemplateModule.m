// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXModuleTemplate/ABI43_0_0EXModuleTemplateModule.h>

@interface ABI43_0_0EXModuleTemplateModule ()

@property (nonatomic, weak) ABI43_0_0EXModuleRegistry *moduleRegistry;

@end

@implementation ABI43_0_0EXModuleTemplateModule

ABI43_0_0EX_EXPORT_MODULE(ExpoModuleTemplate);

- (void)setModuleRegistry:(ABI43_0_0EXModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI43_0_0EX_EXPORT_METHOD_AS(someGreatMethodAsync,
                    options:(NSDictionary *)options
                    resolve:(ABI43_0_0EXPromiseResolveBlock)resolve
                    reject:(ABI43_0_0EXPromiseRejectBlock)reject)
{
}

@end
