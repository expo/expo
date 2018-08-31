// Copyright 2016-present 650 Industries. All rights reserved.

#import <EXGL-CPP/UEXGL.h>
#import <ABI30_0_0EXGL/ABI30_0_0EXGLContext.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistry.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI30_0_0EXGLView : UIView <ABI30_0_0EXGLContextDelegate>

- (instancetype)initWithModuleRegistry:(ABI30_0_0EXModuleRegistry *)moduleRegistry;
- (UEXGLContextId)exglCtxId;

// AR
- (void)setArSessionManager:(id)arSessionManager;
- (void)maybeStopARSession;

@property (nonatomic, copy, nullable) ABI30_0_0EXDirectEventBlock onSurfaceCreate;
@property (nonatomic, assign) NSNumber *msaaSamples;

// "protected"
@property (nonatomic, strong, nullable) ABI30_0_0EXGLContext *glContext;
@property (nonatomic, strong, nullable) EAGLContext *uiEaglCtx;

@end

NS_ASSUME_NONNULL_END
