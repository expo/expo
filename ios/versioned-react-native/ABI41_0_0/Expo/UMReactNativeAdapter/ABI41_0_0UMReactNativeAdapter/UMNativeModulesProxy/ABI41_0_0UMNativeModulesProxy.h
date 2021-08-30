// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI41_0_0React/ABI41_0_0RCTBridgeModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMInternalModule.h>
#import <ABI41_0_0UMCore/ABI41_0_0UMModuleRegistry.h>

// ABI41_0_0RCTBridgeModule capable of receiving method calls from JS and forwarding them
// to proper exported universal modules. Also, it exports important constants to JS, like
// properties of exported methods and modules' constants.

@interface ABI41_0_0UMNativeModulesProxy : NSObject <ABI41_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI41_0_0UMModuleRegistry *)moduleRegistry;

@end

