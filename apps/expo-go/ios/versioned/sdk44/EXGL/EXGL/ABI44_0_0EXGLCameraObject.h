// Copyright 2016-present 650 Industries. All rights reserved.

#import <ABI44_0_0ExpoModulesCore/ABI44_0_0EXCameraInterface.h>

#import <ABI44_0_0EXGL/ABI44_0_0EXGLContext.h>
#import <ABI44_0_0EXGL/ABI44_0_0EXGLObject.h>

@interface ABI44_0_0EXGLCameraObject : ABI44_0_0EXGLObject

- (instancetype)initWithContext:(ABI44_0_0EXGLContext *)glContext andCamera:(id<ABI44_0_0EXCameraInterface>)camera;

@end
