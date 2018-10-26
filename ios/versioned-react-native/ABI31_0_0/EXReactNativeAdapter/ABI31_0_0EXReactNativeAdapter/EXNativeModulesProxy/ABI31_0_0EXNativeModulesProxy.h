// Copyright 2018-present 650 Industries. All rights reserved.

#import <ReactABI31_0_0/ABI31_0_0RCTBridgeModule.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXInternalModule.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistry.h>

// ABI31_0_0RCTBridgeModule capable of receiving method calls from JS and forwarding them
// to proper exported Expo modules. Also, it exports important constants to JS, like
// properties of exported methods and modules' constants.

@interface ABI31_0_0EXNativeModulesProxy : NSObject <ABI31_0_0RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(ABI31_0_0EXModuleRegistry *)moduleRegistry;

@end

