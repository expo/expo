// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXOta/EXOtaModule.h>
#import <EXOta/EXKeyValueStorage.h>
#import <EXOtaUpdater.h>
#import <EXExpoManifestRequestConfig.h>

@interface EXOtaModule ()

@property (nonatomic, weak) UMModuleRegistry *moduleRegistry;

@end

@implementation EXOtaModule {
    EXKeyValueStorage *keyValueStorage;
    EXExpoManifestRequestConfig *config;
    EXOtaUpdater *updater;
}

UM_EXPORT_MODULE(ExpoOta);

- (void)setModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
    _moduleRegistry = moduleRegistry;
    keyValueStorage = [[EXKeyValueStorage alloc] init];
    config = [[EXExpoManifestRequestConfig alloc] initWithBuilder:^(EXOtaConfigBuilder * _Nonnull builder) {
        builder.username = @"mczernek";
        builder.projectName = @"expo-template-bare";
    }];
    updater = [[EXOtaUpdater alloc] initWithConfig:config];
}

UM_EXPORT_METHOD_AS(checkForUpdateAsync,
                    checkForUpdateAsync:(NSDictionary *)options
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
    [updater downloadManifest:^(NSDictionary * _Nonnull manifest) {
        resolve(manifest);
    } error:^(NSError * _Nonnull error) {
        reject(@"ERR_EXPO_OTA", @"Could not download manifest", error);
    }];
}

UM_EXPORT_METHOD_AS(saveValueAsync,
                    saveValueAsync:(NSDictionary *)options
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
    NSString *key = options[@"key"];
    NSString *value = options[@"value"];
    [keyValueStorage persistString:value forKey:key];
    resolve(@{@"result": @YES});
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
                    readValueAsync:(NSDictionary *)options
                    resolve:(UMPromiseResolveBlock)resolve
                    reject:(UMPromiseRejectBlock)reject)
{
    NSString *key = options[@"key"];
    resolve(@{@"result": [keyValueStorage readStringForKey:key]});
}

@end
