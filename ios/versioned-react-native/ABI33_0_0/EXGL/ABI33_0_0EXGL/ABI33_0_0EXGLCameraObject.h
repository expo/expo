// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI33_0_0UMCameraInterface/ABI33_0_0UMCameraInterface.h>

#import <ABI33_0_0EXGL/ABI33_0_0EXGLContext.h>
#import <ABI33_0_0EXGL/ABI33_0_0EXGLObject.h>

@interface ABI33_0_0EXGLCameraObject : ABI33_0_0EXGLObject

- (instancetype)initWithContext:(ABI33_0_0EXGLContext *)glContext andCamera:(id<ABI33_0_0UMCameraInterface>)camera;

@end
