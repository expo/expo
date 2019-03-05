// Copyright 2016-present 650 Industries. All rights reserved.

#import <OpenGLES/EAGL.h>
#import <EXGL-CPP/UEXGL.h>
#import <UMCore/UMModuleRegistry.h>

@class EXGLContext;

@protocol EXGLContextDelegate <NSObject>

- (void)glContextFlushed:(nonnull EXGLContext *)context;
- (void)glContextInitialized:(nonnull EXGLContext *)context;
- (void)glContextWillDestroy:(nonnull EXGLContext *)context;
- (UEXGLObjectId)glContextGetDefaultFramebuffer;

@end

@interface EXGLContext : NSObject

- (instancetype)initWithDelegate:(id<EXGLContextDelegate>)delegate andModuleRegistry:(nonnull UMModuleRegistry *)moduleRegistry;
- (void)initialize:(void(^)(BOOL))callback;
- (BOOL)isInitialized;
- (EAGLContext *)createSharedEAGLContext;
- (void)runAsync:(void(^)(void))callback;
- (void)runInEAGLContext:(EAGLContext*)context callback:(void(^)(void))callback;
- (void)takeSnapshotWithOptions:(nonnull NSDictionary *)options resolve:(UMPromiseResolveBlock)resolve reject:(UMPromiseRejectBlock)reject;
- (void)destroy;

// "protected"
@property (nonatomic, assign) UEXGLContextId contextId;
@property (nonatomic, strong, nonnull) EAGLContext *eaglCtx;
@property (nonatomic, weak, nullable) id <EXGLContextDelegate> delegate;

@end
