// Copyright 2018-present 650 Industries. All rights reserved.

#if !__building_module(ExpoModulesCore)
#import <React/RCTBridge.h>
#else
@class RCTBridge;
#endif

// Forward declarations for types - use protocol for AppContext to avoid Swift.h import
@class EXAppContext;
@class EXRuntime;
@class EXJavaScriptRuntime;
@protocol EXAppContextProtocol;

#if __has_include(<ReactCommon/RCTRuntimeExecutor.h>)
@class RCTRuntimeExecutor;
#endif // React Native >=0.74

/**
 Property name of the core object in the global scope of the Expo JS runtime.
 */
extern NSString *_Nonnull const EXGlobalCoreObjectPropertyName;

@interface EXJavaScriptRuntimeManager : NSObject

- (nonnull instancetype)initWithRuntime:(nonnull void *)runtime;

/**
 Installs the base class for shared objects, i.e. `global.expo.SharedObject`.
 */
- (void)installSharedObjectClass:(void (^_Nonnull)(long))releaser;

/**
 Installs the base class for shared refs, i.e. `global.expo.SharedRef`.
 */
- (void)installSharedRefClass;

/**
 Installs the EventEmitter class in the given runtime as `global.expo.EventEmitter`.
 */
- (void)installEventEmitterClass;

/**
 Installs the NativeModule class in the given runtime as `global.expo.NativeModule`.
 */
- (void)installNativeModuleClass;

@end
