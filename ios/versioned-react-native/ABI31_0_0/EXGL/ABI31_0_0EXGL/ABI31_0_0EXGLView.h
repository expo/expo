// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXGL-CPP/UEXGL.h>
#import <ABI31_0_0EXGL/ABI31_0_0EXGLContext.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistry.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI31_0_0EXGLView : UIView <ABI31_0_0EXGLContextDelegate>

- (instancetype)initWithModuleRegistry:(ABI31_0_0EXModuleRegistry *)moduleRegistry;
- (UEXGLContextId)exglCtxId;

// AR
- (void)setArSessionManager:(id)arSessionManager;
- (void)maybeStopARSession;

@property (nonatomic, copy, nullable) ABI31_0_0EXDirectEventBlock onSurfaceCreate;
@property (nonatomic, assign) NSNumber *msaaSamples;

// "protected"
@property (nonatomic, strong, nullable) ABI31_0_0EXGLContext *glContext;
@property (nonatomic, strong, nullable) EAGLContext *uiEaglCtx;

@end

NS_ASSUME_NONNULL_END
