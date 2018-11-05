// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXCameraInterface/ABI30_0_0EXCameraInterface.h>

#import <ABI30_0_0EXGL/ABI30_0_0EXGLContext.h>
#import <ABI30_0_0EXGL/ABI30_0_0EXGLObject.h>

@interface ABI30_0_0EXGLCameraObject : ABI30_0_0EXGLObject

- (instancetype)initWithContext:(ABI30_0_0EXGLContext *)glContext andCamera:(id<ABI30_0_0EXCameraInterface>)camera;

@end
