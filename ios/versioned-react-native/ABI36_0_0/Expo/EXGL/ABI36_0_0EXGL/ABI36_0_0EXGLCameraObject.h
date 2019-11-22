// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI36_0_0UMCameraInterface/ABI36_0_0UMCameraInterface.h>

#import <ABI36_0_0EXGL/ABI36_0_0EXGLContext.h>
#import <ABI36_0_0EXGL/ABI36_0_0EXGLObject.h>

@interface ABI36_0_0EXGLCameraObject : ABI36_0_0EXGLObject

- (instancetype)initWithContext:(ABI36_0_0EXGLContext *)glContext andCamera:(id<ABI36_0_0UMCameraInterface>)camera;

@end
