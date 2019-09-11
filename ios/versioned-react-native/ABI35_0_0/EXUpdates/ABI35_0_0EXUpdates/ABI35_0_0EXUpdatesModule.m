// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI35_0_0EXUpdates/ABI35_0_0EXUpdatesModule.h>

@interface ABI35_0_0EXUpdatesModule ()

@property (nonatomic, weak) ABI35_0_0UMModuleRegistry *moduleRegistry;

@end

@implementation ABI35_0_0EXUpdatesModule

ABI35_0_0UM_EXPORT_MODULE(ExpoUpdates);

- (void)setModuleRegistry:(ABI35_0_0UMModuleRegistry *)moduleRegistry
{
  _moduleRegistry = moduleRegistry;
}

ABI35_0_0UM_EXPORT_METHOD_AS(someGreatMethodAsync,
                    options:(NSDictionary *)options
                    resolve:(ABI35_0_0UMPromiseResolveBlock)resolve
                    reject:(ABI35_0_0UMPromiseRejectBlock)reject)
{
}

@end
