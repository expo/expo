// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXModuleRegistry.h>

// RCTBridgeModule capable of receiving method calls from JS and forwarding them
// to proper exported universal modules. Also, it exports important constants to JS, like
// properties of exported methods and modules' constants.

NS_SWIFT_NAME(NativeModulesProxy)
@interface EXNativeModulesProxy : NSObject <RCTBridgeModule>

- (nonnull instancetype)initWithModuleRegistry:(nullable EXModuleRegistry *)moduleRegistry;
- (nonnull instancetype)initWithModuleRegistry:(nullable EXModuleRegistry *)moduleRegistry swiftModulesProviderClass:(nullable Class)swiftModulesProviderClass;

@end
