// Copyright 2016-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXCameraInterface.h>

#import <ExpoGL/EXGLContext.h>
#import <ExpoGL/EXGLObject.h>

@interface EXGLCameraObject : EXGLObject

- (instancetype)initWithContext:(EXGLContext *)glContext andCamera:(id<EXCameraInterface>)camera;

@end
