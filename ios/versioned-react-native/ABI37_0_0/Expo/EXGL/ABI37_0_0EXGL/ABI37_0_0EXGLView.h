// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXGL_CPP/UEXGL.h>
#import <ABI37_0_0EXGL/ABI37_0_0EXGLContext.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMModuleRegistry.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI37_0_0EXGLView : UIView <ABI37_0_0EXGLContextDelegate>

- (instancetype)initWithModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry;
- (UEXGLContextId)exglCtxId;

// AR
- (void)setArSessionManager:(id)arSessionManager;
- (void)maybeStopARSession;

@property (nonatomic, copy, nullable) ABI37_0_0UMDirectEventBlock onSurfaceCreate;
@property (nonatomic, assign) NSNumber *msaaSamples;

// "protected"
@property (nonatomic, strong, nullable) ABI37_0_0EXGLContext *glContext;
@property (nonatomic, strong, nullable) EAGLContext *uiEaglCtx;

@end

NS_ASSUME_NONNULL_END
