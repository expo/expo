// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXUpdates/EXUpdatesModule.h>

@interface EXUpdatesModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXUpdatesModule

UM_EXPORT_MODULE(ExpoUpdates);

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
