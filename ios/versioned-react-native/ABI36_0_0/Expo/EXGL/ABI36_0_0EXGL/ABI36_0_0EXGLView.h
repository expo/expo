// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXGL_CPP_LEGACY/UEXGL.h>
#import <ABI36_0_0EXGL/ABI36_0_0EXGLContext.h>
#import <ABI36_0_0UMCore/ABI36_0_0UMModuleRegistry.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI36_0_0EXGLView : UIView <ABI36_0_0EXGLContextDelegate>

- (instancetype)initWithModuleRegistry:(ABI36_0_0UMModuleRegistry *)moduleRegistry;
- (UEXGLContextId)exglCtxId;

// AR
- (void)setArSessionManager:(id)arSessionManager;
- (void)maybeStopARSession;

@property (nonatomic, copy, nullable) ABI36_0_0UMDirectEventBlock onSurfaceCreate;
@property (nonatomic, assign) NSNumber *msaaSamples;

// "protected"
@property (nonatomic, strong, nullable) ABI36_0_0EXGLContext *glContext;
@property (nonatomic, strong, nullable) EAGLContext *uiEaglCtx;

@end

NS_ASSUME_NONNULL_END
