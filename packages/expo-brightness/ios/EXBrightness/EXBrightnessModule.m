// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXBrightness/EXBrightnessModule.h>

@interface EXBrightnessModule ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXBrightnessModule

EX_EXPORT_MODULE(ExpoBrightness);

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
