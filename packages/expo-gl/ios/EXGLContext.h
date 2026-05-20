// Copyright 2016-present 650 Industries. All rights reserved.

#import <OpenGLES/EAGL.h>
#import <ExpoGL/EXGLNativeApi.h>
#import <ExpoModulesCore/EXModuleRegistry.h>
#import <ExpoModulesCore/EXFileSystemInterface.h>

@class EXGLContext;

@protocol EXGLContextDelegate <NSObject>

- (void)glContextFlushed:(nonnull EXGLContext *)context;
- (void)glContextInitialized:(nonnull EXGLContext *)context;
- (void)glContextWillDestroy:(nonnull EXGLContext *)context;
- (EXGLObjectId)glContextGetDefaultFramebuffer;

@end

@interface EXGLContext : NSObject

- (nonnull instancetype)initWithDelegate:(nullable id<EXGLContextDelegate>)delegate
                              fileSystem:(nullable id<EXFileSystemInterface>)fileSystemManager;

/**
 Must be called on the JS thread. The runtimePointer is a raw pointer to `facebook::jsi::Runtime`.
 */
- (void)prepareWithRuntimePointer:(nonnull void *)runtimePointer
                         callback:(nullable void(^)(BOOL))callback
   enableExperimentalWorkletSupport:(BOOL)enableExperimentalWorkletSupport;
- (BOOL)isInitialized;
- (nonnull EAGLContext *)createSharedEAGLContext;
- (void)runAsync:(nonnull void(^)(void))callback;
- (void)runInEAGLContext:(nonnull EAGLContext*)context callback:(nonnull void(^)(void))callback;
- (void)takeSnapshotWithOptions:(nonnull NSDictionary *)options resolve:(nonnull EXPromiseResolveBlock)resolve reject:(nonnull EXPromiseRejectBlock)reject;
- (void)destroy;

// "protected"
@property (nonatomic, assign) EXGLContextId contextId;
@property (nonatomic, strong, nonnull) EAGLContext *eaglCtx;
@property (nonatomic, weak, nullable) id <EXGLContextDelegate> delegate;

@end
