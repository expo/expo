// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXCameraInterface.h>

#import <ABI45_0_0EXGL/ABI45_0_0EXGLContext.h>
#import <ABI45_0_0EXGL/ABI45_0_0EXGLObject.h>

@interface ABI45_0_0EXGLCameraObject : ABI45_0_0EXGLObject

- (instancetype)initWithContext:(ABI45_0_0EXGLContext *)glContext andCamera:(id<ABI45_0_0EXCameraInterface>)camera;

@end
