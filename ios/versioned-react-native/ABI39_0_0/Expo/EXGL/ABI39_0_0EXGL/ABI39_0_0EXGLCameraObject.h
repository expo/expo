// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI39_0_0UMCameraInterface/ABI39_0_0UMCameraInterface.h>

#import <ABI39_0_0EXGL/ABI39_0_0EXGLContext.h>
#import <ABI39_0_0EXGL/ABI39_0_0EXGLObject.h>

@interface ABI39_0_0EXGLCameraObject : ABI39_0_0EXGLObject

- (instancetype)initWithContext:(ABI39_0_0EXGLContext *)glContext andCamera:(id<ABI39_0_0UMCameraInterface>)camera;

@end
