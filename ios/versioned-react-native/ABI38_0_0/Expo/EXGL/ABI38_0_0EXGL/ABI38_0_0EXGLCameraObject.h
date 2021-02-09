// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI38_0_0UMCameraInterface/ABI38_0_0UMCameraInterface.h>

#import <ABI38_0_0EXGL/ABI38_0_0EXGLContext.h>
#import <ABI38_0_0EXGL/ABI38_0_0EXGLObject.h>

@interface ABI38_0_0EXGLCameraObject : ABI38_0_0EXGLObject

- (instancetype)initWithContext:(ABI38_0_0EXGLContext *)glContext andCamera:(id<ABI38_0_0UMCameraInterface>)camera;

@end
