// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXModuleTemplate/EXModuleTemplateModule.h>

@interface EXModuleTemplateModule ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXModuleTemplateModule

EX_EXPORT_MODULE(ExpoModuleTemplate);

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
