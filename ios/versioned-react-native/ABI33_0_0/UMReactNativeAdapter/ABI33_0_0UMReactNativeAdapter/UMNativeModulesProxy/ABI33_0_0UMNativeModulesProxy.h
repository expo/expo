// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI33_0_0/ABI33_0_0RCTBridgeModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMInternalModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistry.h>

// ABI33_0_0RCTBridgeModule capable of receiving method calls from JS and forwarding them
// to proper exported universal modules. Also, it exports important constants to JS, like
// properties of exported methods and modules' constants.

@interface ABI33_0_0UMNativeModulesProxy : NSObject <ABI33_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI33_0_0UMModuleRegistry *)moduleRegistry;

@end

