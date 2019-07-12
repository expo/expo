// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXCameraInterface/ABI31_0_0EXCameraInterface.h>

#import <ABI31_0_0EXGL/ABI31_0_0EXGLContext.h>
#import <ABI31_0_0EXGL/ABI31_0_0EXGLObject.h>

@interface ABI31_0_0EXGLCameraObject : ABI31_0_0EXGLObject

- (instancetype)initWithContext:(ABI31_0_0EXGLContext *)glContext andCamera:(id<ABI31_0_0EXCameraInterface>)camera;

@end
