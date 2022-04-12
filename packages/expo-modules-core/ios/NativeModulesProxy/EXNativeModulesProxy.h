// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/RCTBridgeModule.h>

#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXModuleRegistry.h>

// RCTBridgeModule capable of receiving method calls from JS and forwarding them
// to proper exported universal modules. Also, it exports important constants to JS, like
// properties of exported methods and modules' constants.

// Swift compatibility headers (e.g. `ExpoModulesCore-Swift.h`) are not available in headers,
// so we use class forward declaration here. Swift header must be imported in the `.m` file.
@class SwiftInteropBridge;
@class ModulesProvider;

NS_SWIFT_NAME(NativeModulesProxy)
@interface EXNativeModulesProxy : NSObject <RCTBridgeModule>

@property (nonatomic, strong) SwiftInteropBridge *swiftInteropBridge;

- (nonnull instancetype)init;
- (nonnull instancetype)initWithModuleRegistry:(nullable EXModuleRegistry *)moduleRegistry;

- (void)callMethod:(NSString *)moduleName methodNameOrKey:(id)methodNameOrKey arguments:(NSArray *)arguments resolver:(RCTPromiseResolveBlock)resolve rejecter:(RCTPromiseRejectBlock)reject;
- (id)callMethodSync:(NSString *)moduleName methodName:(NSString *)methodName arguments:(NSArray *)arguments;

+ (ModulesProvider *)getExpoModulesProvider;

@end
