// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXModuleRegistry.h>

@interface ExpoModulesConfig : NSObject<NSCopying>

@property (nonatomic, strong) NSMutableDictionary* exportedConstants;
@property (nonatomic, strong) NSMutableDictionary* methodNames;
@property (nonatomic, strong) NSMutableDictionary* viewManagerMentadata;

- (instancetype)initWithConstants:(NSDictionary*)constants
                      methodNames:(NSDictionary*)methodNames
                     viewManagers:(NSDictionary*)viewManagerMetadata;

- (void)addEntriesFromConfig:(ExpoModulesConfig*)config;
- (NSDictionary<NSString*, id>*) toDictionary;

@end

// RCTBridgeModule capable of receiving method calls from JS and forwarding them
// to proper exported universal modules. Also, it exports important constants to JS, like
// properties of exported methods and modules' constants.

NS_SWIFT_NAME(LegacyNativeModulesProxy)
@interface EXNativeModulesProxy : NSObject <RCTBridgeModule>

- (nonnull instancetype)init;
- (nonnull instancetype)initWithModuleRegistry:(nullable EXModuleRegistry *)moduleRegistry;
- (nonnull instancetype)initWithCustomModuleRegistry:(nonnull EXModuleRegistry *)moduleRegistry;

- (void)callMethod:(NSString *)moduleName methodNameOrKey:(id)methodNameOrKey arguments:(NSArray *)arguments resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject;

@property (nonatomic, strong) ExpoModulesConfig* legacyModulesConfig;

@end
