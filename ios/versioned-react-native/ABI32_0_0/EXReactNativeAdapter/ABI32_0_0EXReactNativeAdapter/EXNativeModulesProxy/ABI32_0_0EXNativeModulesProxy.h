// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI32_0_0/ABI32_0_0RCTBridgeModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXInternalModule.h>
#import <ABI32_0_0EXCore/ABI32_0_0EXModuleRegistry.h>

// ABI32_0_0RCTBridgeModule capable of receiving method calls from JS and forwarding them
// to proper exported Expo modules. Also, it exports important constants to JS, like
// properties of exported methods and modules' constants.

@interface ABI32_0_0EXNativeModulesProxy : NSObject <ABI32_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI32_0_0EXModuleRegistry *)moduleRegistry;

@end

