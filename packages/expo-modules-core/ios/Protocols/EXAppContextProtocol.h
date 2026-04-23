// Copyright 2024-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class EXJavaScriptObject;
@class EXJavaScriptRuntime;
@class EXModuleRegistry;
@class EXModulesProxyConfig;
@class EXRuntime;

NS_ASSUME_NONNULL_BEGIN

typedef void (NS_SWIFT_SENDABLE ^EXPromiseResolveBlock)(id _Nullable result);
typedef void (NS_SWIFT_SENDABLE ^EXPromiseRejectBlock)(NSString * _Nullable code, NSString * _Nullable message, NSError * _Nullable error);

/**
 Protocol defining the interface for AppContext that can be used from Objective-C
 without importing Swift.h, breaking the ObjC → Swift → ObjC cyclic dependency.
 */
@protocol EXAppContextProtocol <NSObject>

#pragma mark - Properties

/**
 The legacy module registry with modules written in the old-fashioned way.
 */
@property(nonatomic, weak, nullable) EXModuleRegistry *legacyModuleRegistry;

/**
 Underlying JSI runtime of the running app.
 */
@property(nonatomic, strong, nullable) EXRuntime *_runtime;

/**
 Secondary JavaScript runtime (typically the Worklets UI runtime) installed
 via `AppContext.uiRuntimeFactory`. Exposed on the ObjC protocol so
 precompiled-xcframework consumers can reach it — see
 `EXWorkletsUIRuntimeFactory.h`. `readonly` because writes must go through
 the Swift setter to fire its `didSet` hook.
 */
@property(nonatomic, strong, readonly, nullable) EXJavaScriptRuntime *_uiRuntime;

/**
 The application identifier used to distinguish between different RCTHost.
 */
@property(nonatomic, readonly, nullable) NSString *appIdentifier;

#pragma mark - Module Management

/**
 Returns a bool whether the module with given name is registered in this context.
 */
- (BOOL)hasModule:(nonnull NSString *)moduleName;

/**
 Returns an array of names of the modules registered in the module registry.
 */
- (nonnull NSArray<NSString *> *)getModuleNames;

/**
 Returns a JavaScript object that represents a module with given name.

 @warning This method must only be called from the JavaScript thread.
 It uses assumeIsolated internally and will crash if called from other threads.
 */
- (nullable EXJavaScriptObject *)getNativeModuleObjectUnsafe:(nonnull NSString *)moduleName;

/**
 Asynchronously calls module's function with given arguments.
 */
- (void)callFunction:(nonnull NSString *)functionName
            onModule:(nonnull NSString *)moduleName
            withArgs:(nonnull NSArray *)args
             resolve:(nonnull EXPromiseResolveBlock)resolve
              reject:(nonnull EXPromiseRejectBlock)reject;

#pragma mark - Native Module Registration

/**
 Registers native modules provided by generated ExpoModulesProvider.
 */
- (void)registerNativeModules;

@end


NS_ASSUME_NONNULL_END
