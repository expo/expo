// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <EXCore/EXModule.h>
#import <EXCore/EXModuleRegistry.h>

@interface EXNativeModulesProxy : RCTEventEmitter <RCTBridgeModule>

@property (nonatomic, strong, readonly) EXModuleRegistry *moduleRegistry;
@property (nonatomic, strong, readonly) NSDictionary<NSString *, NSDictionary<NSString *, NSString *> *> *exportedMethods;

- (instancetype)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry;
- (NSArray<id<RCTBridgeModule>> *)getBridgeModules;

@end

