// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI35_0_0UMCameraInterface/ABI35_0_0UMCameraInterface.h>

#import <ABI35_0_0EXGL/ABI35_0_0EXGLContext.h>
#import <ABI35_0_0EXGL/ABI35_0_0EXGLObject.h>

@interface ABI35_0_0EXGLCameraObject : ABI35_0_0EXGLObject

- (instancetype)initWithContext:(ABI35_0_0EXGLContext *)glContext andCamera:(id<ABI35_0_0UMCameraInterface>)camera;

@end
