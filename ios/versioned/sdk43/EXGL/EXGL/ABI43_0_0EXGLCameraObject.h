// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXCameraInterface.h>

#import <ABI43_0_0EXGL/ABI43_0_0EXGLContext.h>
#import <ABI43_0_0EXGL/ABI43_0_0EXGLObject.h>

@interface ABI43_0_0EXGLCameraObject : ABI43_0_0EXGLObject

- (instancetype)initWithContext:(ABI43_0_0EXGLContext *)glContext andCamera:(id<ABI43_0_0EXCameraInterface>)camera;

@end
