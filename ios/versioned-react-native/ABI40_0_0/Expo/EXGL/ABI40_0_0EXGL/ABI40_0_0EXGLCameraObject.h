// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI40_0_0UMCameraInterface/ABI40_0_0UMCameraInterface.h>

#import <ABI40_0_0EXGL/ABI40_0_0EXGLContext.h>
#import <ABI40_0_0EXGL/ABI40_0_0EXGLObject.h>

@interface ABI40_0_0EXGLCameraObject : ABI40_0_0EXGLObject

- (instancetype)initWithContext:(ABI40_0_0EXGLContext *)glContext andCamera:(id<ABI40_0_0UMCameraInterface>)camera;

@end
