// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0React/ABI46_0_0RCTBridgeModule.h>

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXInternalModule.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistry.h>

// A convenience class, which acts as a store for the native modules proxy config

NS_SWIFT_NAME(ModulesProxyConfig)
@interface ABI46_0_0EXModulesProxyConfig : NSObject

- (instancetype)initWithConstants:(nonnull NSDictionary *)constants
                      methodNames:(nonnull NSDictionary *)methodNames
                     viewManagers:(nonnull NSDictionary *)viewManagerMetadata;

- (void)addEntriesFromConfig:(nonnull const ABI46_0_0EXModulesProxyConfig *)config;
- (nonnull NSDictionary<NSString *, id> *)toDictionary;

@end

// ABI46_0_0RCTBridgeModule capable of receiving method calls from JS and forwarding them
// to proper exported universal modules. Also, it exports important constants to JS, like
// properties of exported methods and modules' constants.

NS_SWIFT_NAME(LegacyNativeModulesProxy)
@interface ABI46_0_0EXNativeModulesProxy : NSObject <ABI46_0_0RCTBridgeModule>

@property (nonatomic, strong, readonly) ABI46_0_0EXModulesProxyConfig *nativeModulesConfig;

- (nonnull instancetype)init;
- (nonnull instancetype)initWithModuleRegistry:(nullable ABI46_0_0EXModuleRegistry *)moduleRegistry;
- (nonnull instancetype)initWithCustomModuleRegistry:(nonnull ABI46_0_0EXModuleRegistry *)moduleRegistry;

- (void)callMethod:(NSString *)moduleName methodNameOrKey:(id)methodNameOrKey arguments:(NSArray *)arguments resolver:(ABI46_0_0RCTPromiseResolveBlock)resolve rejecter:(ABI46_0_0RCTPromiseRejectBlock)reject;

@end
