// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI49_0_0ExpoModulesCore/ABI49_0_0EXCameraInterface.h>

#import <ABI49_0_0ExpoGL/ABI49_0_0EXGLContext.h>
#import <ABI49_0_0ExpoGL/ABI49_0_0EXGLObject.h>

@interface ABI49_0_0EXGLCameraObject : ABI49_0_0EXGLObject

- (instancetype)initWithContext:(ABI49_0_0EXGLContext *)glContext andCamera:(id<ABI49_0_0EXCameraInterface>)camera;

@end
