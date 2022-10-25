// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXGL/ABI47_0_0EXGLNativeApi.h>
#import <ABI47_0_0EXGL/ABI47_0_0EXGLContext.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXModuleRegistry.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI47_0_0EXGLView : UIView <ABI47_0_0EXGLContextDelegate>

- (instancetype)initWithModuleRegistry:(ABI47_0_0EXModuleRegistry *)moduleRegistry;
- (ABI47_0_0EXGLContextId)exglCtxId;

// AR
- (void)setArSessionManager:(id)arSessionManager;
- (void)maybeStopARSession;

@property (nonatomic, copy, nullable) ABI47_0_0EXDirectEventBlock onSurfaceCreate;
@property (nonatomic, assign) NSNumber *msaaSamples;

// "protected"
@property (nonatomic, strong, nullable) ABI47_0_0EXGLContext *glContext;
@property (nonatomic, strong, nullable) EAGLContext *uiEaglCtx;

@end

NS_ASSUME_NONNULL_END
