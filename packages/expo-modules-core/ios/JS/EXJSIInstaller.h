// Copyright 2018-present 650 Industries. All rights reserved.

/**
 Property name of the core object in the global scope of the Expo JS runtime.
 */
extern NSString *_Nonnull const EXGlobalCoreObjectPropertyName;

@interface EXJavaScriptRuntimeManager : NSObject

/**
 Initializes the runtime installer with a raw pointer to the runtime.
 It must be a raw pointer instead of `jsi::Runtime` to be visible for Swift without C++ interop.
 */
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
