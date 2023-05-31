// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoGL/EXGLNativeApi.h>
#import <ExpoGL/EXGLContext.h>
#import <ExpoModulesCore/EXModuleRegistry.h>
#import <ExpoModulesCore/EXLegacyExpoViewProtocol.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXGLView : UIView <EXGLContextDelegate, EXLegacyExpoViewProtocol>

- (EXGLContextId)exglCtxId;

// AR
- (void)setArSessionManager:(id)arSessionManager;
- (void)maybeStopARSession;

@property (nonatomic, copy, nullable) EXDirectEventBlock onSurfaceCreate;
@property (nonatomic, assign) NSInteger msaaSamples;
@property (nonatomic, assign) BOOL enableExperimentalWorkletSupport;

// "protected"
@property (nonatomic, strong, nullable) EXGLContext *glContext;
@property (nonatomic, strong, nullable) EAGLContext *uiEaglCtx;

@end

NS_ASSUME_NONNULL_END
