// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI41_0_0UMCameraInterface/ABI41_0_0UMCameraInterface.h>

#import <ABI41_0_0EXGL/ABI41_0_0EXGLContext.h>
#import <ABI41_0_0EXGL/ABI41_0_0EXGLObject.h>

@interface ABI41_0_0EXGLCameraObject : ABI41_0_0EXGLObject

- (instancetype)initWithContext:(ABI41_0_0EXGLContext *)glContext andCamera:(id<ABI41_0_0UMCameraInterface>)camera;

@end
