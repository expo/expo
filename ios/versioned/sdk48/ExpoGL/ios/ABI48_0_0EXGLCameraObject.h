// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXCameraInterface.h>

#import <ABI48_0_0ExpoGL/ABI48_0_0EXGLContext.h>
#import <ABI48_0_0ExpoGL/ABI48_0_0EXGLObject.h>

@interface ABI48_0_0EXGLCameraObject : ABI48_0_0EXGLObject

- (instancetype)initWithContext:(ABI48_0_0EXGLContext *)glContext andCamera:(id<ABI48_0_0EXCameraInterface>)camera;

@end
