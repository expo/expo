// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI46_0_0EXGL_CPP/ABI46_0_0EXGL.h>
#import <ABI46_0_0EXGL/ABI46_0_0EXGLContext.h>
#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXModuleRegistry.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI46_0_0EXGLView : UIView <ABI46_0_0EXGLContextDelegate>

- (instancetype)initWithModuleRegistry:(ABI46_0_0EXModuleRegistry *)moduleRegistry;
- (ABI46_0_0EXGLContextId)exglCtxId;

// AR
- (void)setArSessionManager:(id)arSessionManager;
- (void)maybeStopARSession;

@property (nonatomic, copy, nullable) ABI46_0_0EXDirectEventBlock onSurfaceCreate;
@property (nonatomic, assign) NSNumber *msaaSamples;

// "protected"
@property (nonatomic, strong, nullable) ABI46_0_0EXGLContext *glContext;
@property (nonatomic, strong, nullable) EAGLContext *uiEaglCtx;

@end

NS_ASSUME_NONNULL_END
