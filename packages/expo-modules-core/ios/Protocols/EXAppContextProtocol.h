// Copyright 2024-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>

@class EXJavaScriptObject;
@class EXModuleRegistry;
@class EXModulesProxyConfig;
@class EXNativeModulesProxy;
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
 The legacy modules proxy.
 */
@property(nonatomic, weak, nullable) EXNativeModulesProxy *legacyModulesProxy;

/**
 Underlying JSI runtime of the running app.
 */
@property(nonatomic, strong, nullable) EXRuntime *_runtime;

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
 */
- (nullable EXJavaScriptObject *)getNativeModuleObject:(nonnull NSString *)moduleName;

/**
 Returns an array of event names supported by all Swift modules.
 */
- (nonnull NSArray<NSString *> *)getSupportedEvents;

/**
 Modifies listeners count for module with given name.
 */
- (void)modifyEventListenersCount:(nonnull NSString *)moduleName count:(NSInteger)count;

/**
 Asynchronously calls module's function with given arguments.
 */
- (void)callFunction:(nonnull NSString *)functionName
            onModule:(nonnull NSString *)moduleName
            withArgs:(nonnull NSArray *)args
             resolve:(nonnull EXPromiseResolveBlock)resolve
              reject:(nonnull EXPromiseRejectBlock)reject;

/**
 Returns the expo modules config for the native modules proxy.
 */
@property(nonatomic, readonly, nonnull) EXModulesProxyConfig *expoModulesConfig;

#pragma mark - View Management

/**
 Returns view modules wrapped by the base ViewModuleWrapper class.
 Returns NSArray of objects (ViewModuleWrapper instances).
 */
- (nonnull NSArray *)getViewManagers;

#pragma mark - Native Module Registration

/**
 Registers native modules provided by generated ExpoModulesProvider.
 */
- (void)registerNativeModules;

@end

#pragma mark - Factory Protocol

/**
 Factory protocol for creating AppContext instances from Objective-C
 without importing Swift.h.
 */
@protocol EXAppContextFactoryProtocol <NSObject>

/**
 Creates a new AppContext instance.
 */
+ (nonnull id<EXAppContextProtocol>)createAppContext;

@end

NS_ASSUME_NONNULL_END
