// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>
#import <EXCore/EXInternalModule.h>
#import <EXCore/EXModuleRegistry.h>

// RCTBridgeModule capable of receiving method calls from JS and forwarding them
// to proper exported Expo modules. Also, it exports important constants to JS, like
// properties of exported methods and modules' constants.

@interface EXNativeModulesProxy : NSObject <RCTBridgeModule>

- (instancetype)initWithModuleRegistry:(EXModuleRegistry *)moduleRegistry;

@end

