// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXModuleRegistry.h>

// A convenience class, which acts as a store for the native modules proxy config

NS_SWIFT_NAME(ModulesProxyConfig)
@interface EXModulesProxyConfig : NSObject

- (instancetype)initWithConstants:(nonnull NSDictionary *)constants
                      methodNames:(nonnull NSDictionary *)methodNames
                     viewManagers:(nonnull NSDictionary *)viewManagerMetadata;

- (void)addEntriesFromConfig:(nonnull const EXModulesProxyConfig *)config;
- (nonnull NSDictionary<NSString *, id> *)toDictionary;

@end

// RCTBridgeModule capable of receiving method calls from JS and forwarding them
// to proper exported universal modules. Also, it exports important constants to JS, like
// properties of exported methods and modules' constants.

NS_SWIFT_NAME(LegacyNativeModulesProxy)
@interface EXNativeModulesProxy : NSObject <RCTBridgeModule>

@property(nonatomic, strong, readonly) EXModulesProxyConfig *nativeModulesConfig;

- (nonnull instancetype)init;
- (nonnull instancetype)initWithModuleRegistry:(nullable EXModuleRegistry *)moduleRegistry;
- (nonnull instancetype)initWithCustomModuleRegistry:(nonnull EXModuleRegistry *)moduleRegistry;

- (void)callMethod:(NSString *)moduleName methodNameOrKey:(id)methodNameOrKey arguments:(NSArray *)arguments resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject;

@end
