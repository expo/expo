// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXOta/EXOtaModule.h>
#import <EXOta/EXKeyValueStorage.h>

@interface EXOtaModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXOtaModule {
    EXKeyValueStorage *keyValueStorage;
}

UM_EXPORT_MODULE(ExpoOta);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
    _moduleRegistry = moduleRegistry;
    keyValueStorage = [EXKeyValueStorage init];
}

UM_EXPORT_METHOD_AS(saveValueAsync,
                    options:(NSDictionary *)options
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
}

@end
