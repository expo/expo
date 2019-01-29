// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXAmplitude/EXAmplitudeModule.h>

@interface EXAmplitudeModule ()

@property (nonatomic, weak) EXModuleRegistry *moduleRegistry;

@end

@implementation EXAmplitudeModule

EX_EXPORT_MODULE(ExpoAmplitude);

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
