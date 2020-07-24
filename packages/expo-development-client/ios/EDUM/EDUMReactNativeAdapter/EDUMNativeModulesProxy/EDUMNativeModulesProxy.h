// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>
#import <EDUMInternalModule.h>
#import <EDUMModuleRegistry.h>

// RCTBridgeModule capable of receiving method calls from JS and forwarding them
// to proper exported universal modules. Also, it exports important constants to JS, like
// properties of exported methods and modules' constants.

@interface EDUMNativeModulesProxy : NSObject <RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(EDUMModuleRegistry *)moduleRegistry;

@end

