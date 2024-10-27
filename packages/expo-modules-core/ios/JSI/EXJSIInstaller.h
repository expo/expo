// Copyright 2018-present 650 Industries. All rights reserved.

#import <React/React-Core-umbrella.h>

// Swift classes need forward-declaration in the headers.
@class EXAppContext;
@class EXRuntime;

#if __has_include(<ReactCommon/RCTRuntimeExecutor.h>)
@class RCTRuntimeExecutor;
#endif // React Native >=0.74

/**
 Property name of the core object in the global scope of the Expo JS runtime.
 */
extern NSString * _Nonnull const EXGlobalCoreObjectPropertyName;

@interface EXJavaScriptRuntimeManager : NSObject

/**
 Gets the JS runtime from the given bridge. May return `nil` when
 the runtime is not available yet or the remote debugging is enabled.
 */
+ (nullable EXRuntime *)runtimeFromBridge:(nonnull RCTBridge *)bridge NS_SWIFT_NAME(runtime(fromBridge:));

#if __has_include(<ReactCommon/RCTRuntimeExecutor.h>)
+ (nullable EXRuntime *)runtimeFromBridge:(nonnull RCTBridge *)bridge withExecutor:(nonnull RCTRuntimeExecutor *)executor;
#endif // React Native >=0.74

/**
 Installs ExpoModules host object in the runtime of the given app context.
 Returns a bool value whether the installation succeeded.
 */
+ (BOOL)installExpoModulesHostObject:(nonnull EXAppContext *)appContext;

/**
 Installs the base class for shared objects, i.e. `global.expo.SharedObject`.
 */
+ (void)installSharedObjectClass:(nonnull EXRuntime *)runtime releaser:(void(^)(long))releaser;

/**
 Installs the base class for shared refs, i.e. `global.expo.SharedRef`.
 */
+ (void)installSharedRefClass:(nonnull EXRuntime *)runtime;

/**
 Installs the EventEmitter class in the given runtime as `global.expo.EventEmitter`.
 */
+ (void)installEventEmitterClass:(nonnull EXRuntime *)runtime;

/**
 Installs the NativeModule class in the given runtime as `global.expo.NativeModule`.
 */
+ (void)installNativeModuleClass:(nonnull EXRuntime *)runtime;

@end
