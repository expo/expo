// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXOta/EXOtaModule.h>
#import <EXOta/EXKeyValueStorage.h>
#import <EXOta/EXOtaPersistance.h>
#import "EXOtaPersistanceFactory.h"
#import <EXOtaUpdater.h>
#import <EXExpoUpdatesConfig.h>

@interface EXOtaModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXOtaModule {
    EXKeyValueStorage *keyValueStorage;
    EXExpoUpdatesConfig *config;
    EXOtaUpdater *updater;
    EXOtaPersistance *persistance;
}

UM_EXPORT_MODULE(ExpoOta);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
    _moduleRegistry = moduleRegistry;
    keyValueStorage = [[EXKeyValueStorage alloc] init];
    config = [[EXExpoUpdatesConfig alloc] initWithBuilder:^(EXExpoUpdatesConfigBuilder * _Nonnull builder) {
        builder.username = @"mczernek";
        builder.projectName = @"expo-template-bare";
    }];
    updater = [[EXOtaUpdater alloc] initWithConfig:config withId:@"expo-template-bare"];
    persistance = [EXOtaPersistanceFactory.sharedFactory persistanceForId:@"expo-template-bare"];
}

UM_EXPORT_METHOD_AS(checkForUpdateAsync,
                    checkForUpdateAsync:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
    [updater downloadManifest:^(NSDictionary * _Nonnull manifest) {
        resolve(manifest);
    } error:^(NSError * _Nonnull error) {
        reject(@"ERR_EXPO_OTA", @"Could not download manifest", error);
    }];
}

UM_EXPORT_METHOD_AS(fetchUpdatesAsync,
                    fetchUpdatesAsync:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
    [updater checkAndDownloadUpdate:^(NSDictionary * _Nonnull manifest, NSString * _Nonnull filePath) {
        resolve(@{
            @"bundle": filePath
        });
    } error:^(NSError * _Nonnull error) {
        reject(@"ERR_EXPO_OTA", @"Could not download update", error);
    }];
}

UM_EXPORT_METHOD_AS(removeValue,
                    removeValue:(NSDictionary *)options
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
    NSString *key = options[@"key"];
    [keyValueStorage removeValueForKey:key];
    resolve(@{@"result": @YES});
}

UM_EXPORT_METHOD_AS(readValueAsync,
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
    resolve(@{@"result": [persistance bundlePath]});
}

@end
