// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI29_0_0EXCameraInterface/ABI29_0_0EXCameraInterface.h>

#import <ABI29_0_0EXGL/ABI29_0_0EXGLContext.h>
#import <ABI29_0_0EXGL/ABI29_0_0EXGLObject.h>

@interface ABI29_0_0EXGLCameraObject : ABI29_0_0EXGLObject

- (instancetype)initWithContext:(ABI29_0_0EXGLContext *)glContext andCamera:(id<ABI29_0_0EXCameraInterface>)camera;

@end
