// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXCameraInterface.h>

#import <ABI42_0_0EXGL/ABI42_0_0EXGLContext.h>
#import <ABI42_0_0EXGL/ABI42_0_0EXGLObject.h>

@interface ABI42_0_0EXGLCameraObject : ABI42_0_0EXGLObject

- (instancetype)initWithContext:(ABI42_0_0EXGLContext *)glContext andCamera:(id<ABI42_0_0EXCameraInterface>)camera;

@end
