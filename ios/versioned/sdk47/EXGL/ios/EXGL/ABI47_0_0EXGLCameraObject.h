// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXCameraInterface.h>

#import <ABI47_0_0EXGL/ABI47_0_0EXGLContext.h>
#import <ABI47_0_0EXGL/ABI47_0_0EXGLObject.h>

@interface ABI47_0_0EXGLCameraObject : ABI47_0_0EXGLObject

- (instancetype)initWithContext:(ABI47_0_0EXGLContext *)glContext andCamera:(id<ABI47_0_0EXCameraInterface>)camera;

@end
