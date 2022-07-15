// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXCameraInterface.h>

#import <ABI46_0_0EXGL/ABI46_0_0EXGLContext.h>
#import <ABI46_0_0EXGL/ABI46_0_0EXGLObject.h>

@interface ABI46_0_0EXGLCameraObject : ABI46_0_0EXGLObject

- (instancetype)initWithContext:(ABI46_0_0EXGLContext *)glContext andCamera:(id<ABI46_0_0EXCameraInterface>)camera;

@end
