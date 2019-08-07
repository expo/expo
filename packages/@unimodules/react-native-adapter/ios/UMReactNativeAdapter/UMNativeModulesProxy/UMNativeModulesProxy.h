// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>
#import <UMCore/UMInternalModule.h>
#import <UMCore/UMModuleRegistry.h>

// RCTBridgeModule capable of receiving method calls from JS and forwarding them
// to proper exported universal modules. Also, it exports important constants to JS, like
// properties of exported methods and modules' constants.

@interface UMNativeModulesProxy : NSObject <RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(UMModuleRegistry *)moduleRegistry;

@end

