// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI37_0_0UMCameraInterface/ABI37_0_0UMCameraInterface.h>

#import <ABI37_0_0EXGL/ABI37_0_0EXGLContext.h>
#import <ABI37_0_0EXGL/ABI37_0_0EXGLObject.h>

@interface ABI37_0_0EXGLCameraObject : ABI37_0_0EXGLObject

- (instancetype)initWithContext:(ABI37_0_0EXGLContext *)glContext andCamera:(id<ABI37_0_0UMCameraInterface>)camera;

@end
