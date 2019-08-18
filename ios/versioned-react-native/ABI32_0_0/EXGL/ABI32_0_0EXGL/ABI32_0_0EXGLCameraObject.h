// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI32_0_0EXCameraInterface/ABI32_0_0EXCameraInterface.h>

#import <ABI32_0_0EXGL/ABI32_0_0EXGLContext.h>
#import <ABI32_0_0EXGL/ABI32_0_0EXGLObject.h>

@interface ABI32_0_0EXGLCameraObject : ABI32_0_0EXGLObject

- (instancetype)initWithContext:(ABI32_0_0EXGLContext *)glContext andCamera:(id<ABI32_0_0EXCameraInterface>)camera;

@end
