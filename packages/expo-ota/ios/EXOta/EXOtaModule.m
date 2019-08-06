// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXOta/EXOtaModule.h>

@interface EXOtaModule ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXOtaModule

EX_EXPORT_MODULE(ExpoOta);

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
