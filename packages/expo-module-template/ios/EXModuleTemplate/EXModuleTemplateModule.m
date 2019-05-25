// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXModuleTemplate/EXModuleTemplateModule.h>

@interface EXModuleTemplateModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXModuleTemplateModule

UM_EXPORT_MODULE(ExpoModuleTemplate);

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
