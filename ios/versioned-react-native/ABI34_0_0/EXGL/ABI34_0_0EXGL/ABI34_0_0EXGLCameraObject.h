// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI34_0_0UMCameraInterface/ABI34_0_0UMCameraInterface.h>

#import <ABI34_0_0EXGL/ABI34_0_0EXGLContext.h>
#import <ABI34_0_0EXGL/ABI34_0_0EXGLObject.h>

@interface ABI34_0_0EXGLCameraObject : ABI34_0_0EXGLObject

- (instancetype)initWithContext:(ABI34_0_0EXGLContext *)glContext andCamera:(id<ABI34_0_0UMCameraInterface>)camera;

@end
