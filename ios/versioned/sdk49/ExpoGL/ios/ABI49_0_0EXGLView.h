// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoGL/ABI49_0_0EXGLNativeApi.h>
#import <ABI49_0_0ExpoGL/ABI49_0_0EXGLContext.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXModuleRegistry.h>
#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXLegacyExpoViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI49_0_0EXGLView : UIView <ABI49_0_0EXGLContextDelegate, ABI49_0_0EXLegacyExpoViewProtocol>

- (ABI49_0_0EXGLContextId)exglCtxId;

// AR
- (void)setArSessionManager:(id)arSessionManager;
- (void)maybeStopARSession;

@property (nonatomic, copy, nullable) ABI49_0_0EXDirectEventBlock onSurfaceCreate;
@property (nonatomic, assign) NSInteger msaaSamples;
@property (nonatomic, assign) BOOL enableExperimentalWorkletSupport;

// "protected"
@property (nonatomic, strong, nullable) ABI49_0_0EXGLContext *glContext;
@property (nonatomic, strong, nullable) EAGLContext *uiEaglCtx;

@end

NS_ASSUME_NONNULL_END
